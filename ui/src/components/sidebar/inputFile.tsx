import { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import '../style/InputFile.scss';

const InputFile = ({
    files,
    updateFiles,
    changeStateFileIsUploading,
    changeStateAnyFileUploaded,
    api,
    supportedFiles,
}: {
    files: any;
    updateFiles: any;
    changeStateFileIsUploading: any;
    changeStateAnyFileUploaded: any;
    api: any;
    supportedFiles: string;
}) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const formData = new FormData();
    const handleClick = () => {
        // open file input box on click of other element
        inputRef?.current?.click();
    };
    const handleFileChange = async (event: any) => {
        event.preventDefault();
        const fileObj = event.target.files && event.target.files[0];
        if (!fileObj) {
            return;
        }
        const fileAlreadyUploaded = files.some((file: any) => file.name === fileObj.name);
        if (fileAlreadyUploaded) {
            alert('File già caricato, seleziona un file con un nome diverso.');
            return;
        }
        fileObj.isUploading = true;
        changeStateFileIsUploading(true);
        updateFiles(fileObj);
        console.log('fileObj is', fileObj);
        // reset file input
        event.target.value = null;

        // is now empty
        console.log(event.target.files);

        // can still access file object here with  fileObj and fileObj.name
        formData.append('file', fileObj, fileObj.name);
        api(formData)
            .then((result: any) => {
                console.log('Response after the document was uploaded', result);
                updateFiles(fileObj);
                fileObj.isUploading = false;
                changeStateFileIsUploading(false);
                changeStateAnyFileUploaded(true);
            })
            .catch((error: any) => {
                console.log('An error occured after trying to upload a file:', error);
                fileObj.isUploading = false;
                changeStateFileIsUploading(false);
            });
        // da fare try catch (se uploadOntology ok => ... altrimenti catch errore)
    };

    return (
        <>
            <div className="file-card">
                <div className="file-inputs">
                    <input ref={inputRef} type="file" onChange={handleFileChange} />
                    <button onClick={handleClick}>
                        <i>
                            <FontAwesomeIcon icon={faPlus} />
                        </i>
                        Upload File
                    </button>
                </div>
                <p className="main">Supported files</p>
                <p className="info">{supportedFiles}</p>
            </div>
        </>
    );
};

export default InputFile;
