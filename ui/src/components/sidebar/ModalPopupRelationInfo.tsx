import React, { useState, useContext } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { infoRelation, AnnotationStore, RelationGroup } from '../../context';
import 'bootstrap/dist/css/bootstrap.min.css';
import { RelationInfo } from './RelationInfo';

interface RelationProps {
    relation: RelationGroup;
}

const App = ({ relation }: RelationProps) => {
    const [show, setShow] = useState(false);
    const annotationStore = useContext(AnnotationStore);

    const deleteRelation = () => {
        annotationStore.setPdfAnnotations(annotationStore.pdfAnnotations.deleteRelation(relation));
        handleClose();
    };
    const handleClose = () => {
        setShow(false);
    };
    const handleShow = () => setShow(true);
    const infoR: infoRelation = annotationStore.pdfAnnotations.getAnnotationsOfRelation(relation);
    return (
        <>
            <Button variant="primary" className="btn m-1" onClick={handleShow}>
                Manage Relation
            </Button>

            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Manage Relation</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <RelationInfo info={infoR}></RelationInfo>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={deleteRelation}>
                        Delete
                    </Button>
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
