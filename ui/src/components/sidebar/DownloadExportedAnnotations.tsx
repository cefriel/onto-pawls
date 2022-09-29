import axios from 'axios';
import React, { useState } from 'react';
import { useDownloadFile } from '../../utils/useDownloadFile';
import { Button, ButtonState } from './button';
import { Alert } from 'react-bootstrap';

export const DownloadExportedAnnotations: React.FC = () => {
    const [buttonState, setButtonState] = useState<ButtonState>(ButtonState.Primary);
    const [showAlert, setShowAlert] = useState<boolean>(false);

    const preDownloading = () => setButtonState(ButtonState.Loading);
    const postDownloading = () => setButtonState(ButtonState.Primary);

    const onErrorDownloadFile = () => {
        setButtonState(ButtonState.Primary);
        setShowAlert(true);
        setTimeout(() => {
            setShowAlert(false);
        }, 3000);
    };

    const downloadFile = () => {
        return axios.get('/api/annotation/export', {
            responseType: 'blob',
            /* 
                headers: {
                Authorization: 'Bearer <token>', // add authentication information as required by the backend APIs.
                },
            */
        });
    };

    const { ref, url, download, name } = useDownloadFile({
        apiDefinition: downloadFile,
        preDownloading,
        postDownloading,
        onError: onErrorDownloadFile,
    });

    return (
        <div>
            <Alert variant="danger" show={showAlert}>
                Something went wrong. Please try again!
            </Alert>
            <a href={url} download={name} className="danger" ref={ref} />
            <Button label="Export Annotations" buttonState={buttonState} onClick={download} />
        </div>
    );
};
