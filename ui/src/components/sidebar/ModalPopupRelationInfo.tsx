import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { infoRelation } from '../../context';
import 'bootstrap/dist/css/bootstrap.min.css';
import { RelationInfo } from './RelationInfo';

export interface RelationProps {
    info: infoRelation;
}

const App = ({ info }: RelationProps) => {
    const [show, setShow] = useState(false);

    const handleClose = () => {
        setShow(false);
    };
    const handleShow = () => setShow(true);

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
                    <RelationInfo info={info}></RelationInfo>
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
