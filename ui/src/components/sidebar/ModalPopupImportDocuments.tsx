import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { notification } from '@allenai/varnish';
import InputFile from './inputFile';
import FileList from './FileList';
import { getAllocatedPaperStatus, uploadDocument } from '../../api/index';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
    const [show, setShow] = useState(false);
    const [files, setFiles]: [files: any, setFiles: any] = useState([]);
    const supportedFiles = 'PDF';
    const api = (param: any) => {
        uploadDocument(param);
    };
    useEffect(() => {
        getAllocatedPaperStatus()
            .then((allocation) => {
                const namesDocuments: string[] = allocation.papers.map((paper: any) => paper.name);
                console.log('Names of documents: ', namesDocuments);
                setFiles(allocation.papers);
            })
            .catch((err: any) => {
                console.log(err);
                notification.warn({
                    message: 'Error',
                    description: 'Error showing list of documents already imported.',
                });
            });
    }, []);

    const removeFile = (filename: any) => {
        console.log('File to remove: ', filename);
        // no action for now
    };
    const handleClose = () => {
        setShow(false);
    };
    const handleShow = () => setShow(true);
    const updateFiles = (_file: any) => {
        const ontologiesNamesUpdated: string[] = [];
        files.map((f: any) => ontologiesNamesUpdated.push(f.name));
        ontologiesNamesUpdated.push(_file.name);
        setFiles([...files, _file]);
    };

    return (
        <>
            <Button variant="primary" className="btn m-1" onClick={handleShow}>
                Manage Documents
            </Button>

            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Manage Documents</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <InputFile
                        files={files}
                        updateFiles={updateFiles}
                        api={api}
                        supportedFiles={supportedFiles}></InputFile>
                    <Form>
                        <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
                            <FileList files={files} removeFile={removeFile} />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleClose}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default App;
