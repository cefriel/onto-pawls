import { AxiosResponse } from 'axios';
import { useRef, useState } from 'react';

interface DownloadFileProps {
    readonly apiDefinition: () => Promise<AxiosResponse<Blob>>;
    readonly preDownloading: () => void;
    readonly postDownloading: () => void;
    readonly onError: () => void;
}

interface DownloadedFileInfo {
    readonly download: () => Promise<void>;
    readonly ref: React.MutableRefObject<HTMLAnchorElement | null>;
    readonly name: string | undefined;
    readonly url: string | undefined;
}

export const useDownloadFile = ({
    apiDefinition,
    preDownloading,
    postDownloading,
    onError,
}: DownloadFileProps): DownloadedFileInfo => {
    const ref = useRef<HTMLAnchorElement | null>(null);
    const [url, setFileUrl] = useState<string>();
    const [name, setFileName] = useState<string>();

    const filenameFromResponse = (response: any) => {
        const headerval = response.headers['content-disposition'];
        return headerval.split(';')[1].split('=')[1].replace('"', '').replace('"', '');
    };

    const download = async () => {
        try {
            preDownloading();
            const response = await apiDefinition();
            console.log('DATA:', response);
            const url = URL.createObjectURL(new Blob([response.data]));
            setFileUrl(url);
            setFileName(filenameFromResponse(response));
            ref.current?.click();
            postDownloading();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.log(error);
            onError();
        }
    };

    return { download, ref, url, name };
};
