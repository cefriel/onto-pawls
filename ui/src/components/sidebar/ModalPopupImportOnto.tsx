import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import InputFile from './inputFile';
import FileList from './FileList';
import { OntologiesNames, getClasses, getProperties } from '../../api/index';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = ({ annotationStore }: { annotationStore: any }) => {
    const [show, setShow] = useState(false);
    const [files, setFiles]: [files: any, setFiles: any] = useState([]);
    const supportedFiles = 'N-Triples, RDF/XML, OWL/XML';

    useEffect(() => {
        const _ontoNames = annotationStore.ontoNames.ontologiesNames;
        // Chiamo api: dammi lista dei file che sono già stati caricati predentemente
        if (_ontoNames.length > 0) {
            const names = _ontoNames.map((value: any) => ({
                key: value, // forse non serve più
                name: value,
            }));
            console.log('names', names);
            setFiles(names);
        }
    }, []);

    useEffect(() => {
        askDataOfOntologies();
    }, [files]);
    const removeFile = (filename: any) => {
        const filesUpdated = files.filter((file: any) => file.name !== filename);
        const ontologiesNames: string[] = filesUpdated.map((file: any) => file.name);
        const ontoNamesResult: OntologiesNames = { ontologiesNames: ontologiesNames };
        annotationStore.setOntoNames(ontoNamesResult);
        console.log('New list of Names after removing ', filename, ' is: ', ontoNamesResult);
        console.log('AnnotationStore.ontoNames: ', annotationStore.ontoNames);
        if (ontologiesNames.length === 0) {
            annotationStore.setOntoClasses([]);
            annotationStore.setOntoProperties([]);
        }
        setFiles(filesUpdated);
    };
    const handleClose = () => {
        setShow(false);
    };
    const handleShow = () => setShow(true);
    const askDataOfOntologies = () => {
        if (files && files.length > 0) {
            // Chiedi prima tutte le classi e setta la var di annotationStore
            // Chiedi ora tutte le properties e setta la var di annotationStore
            const ontologiesNamesToSend: string[] = [];
            files.map((f: any) => ontologiesNamesToSend.push(f.name));
            console.log('Result names of onto: ', ontologiesNamesToSend);
            const ontoNamesResult: OntologiesNames = { ontologiesNames: ontologiesNamesToSend };
            getClasses(ontoNamesResult).then((ontoClasses) => {
                if (ontoClasses !== undefined) {
                    annotationStore.setOntoClasses(ontoClasses);
                    console.log('annotationStore - classes set with: ', ontoClasses);
                }
            });
            getProperties(ontoNamesResult).then((ontoProperties) => {
                if (ontoProperties !== undefined) {
                    annotationStore.setOntoProperties(ontoProperties);
                }
            });
        }
    };
    const updateFiles = (_file: any) => {
        const ontologiesNamesUpdated: string[] = [];
        files.map((f: any) => ontologiesNamesUpdated.push(f.name));
        ontologiesNamesUpdated.push(_file.name);
        const ontoNamesResult: OntologiesNames = { ontologiesNames: ontologiesNamesUpdated };
        annotationStore.setOntoNames(ontoNamesResult);
        setFiles([...files, _file]);
    };

    return (
        <>
            <Button variant="primary" className="btn m-1" onClick={handleShow}>
                Manage Ontologies
            </Button>

            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Manage Ontologies</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <InputFile
                        files={files}
                        updateFiles={updateFiles}
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