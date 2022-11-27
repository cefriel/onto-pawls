import React, { useState, useContext } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { infoRelation, AnnotationStore, RelationGroup } from '../../context';
import 'bootstrap/dist/css/bootstrap.min.css';
import { RelationInfo } from './RelationInfo';
import { Tag } from '@allenai/varnish';
import styled from 'styled-components';
import { FullscreenOutlined } from '@ant-design/icons';

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
        <div>
            {infoR &&
            infoR.sourceAnnotation !== undefined &&
            infoR.targetAnnotation !== undefined &&
            infoR.sourceAnnotation.text !== null &&
            infoR.targetAnnotation.text !== null ? (
                <>
                    <PaddedRow>
                        <Overflow title={infoR.sourceAnnotation?.text}>
                            {infoR.sourceAnnotation?.text}
                        </Overflow>
                        <Overflow title={infoR.targetAnnotation?.text}>
                            {infoR.targetAnnotation?.text}
                        </Overflow>
                        <SmallTag title={relation.ontoProperty.text}>
                            {relation.ontoProperty.text}
                        </SmallTag>
                        <FullscreenOutlined onClick={handleShow} />
                    </PaddedRow>

                    <Modal show={show} onHide={handleClose}>
                        <Modal.Header closeButton>
                            <Modal.Title>Manage Relation</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <RelationInfo info={infoR}></RelationInfo>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="danger" onClick={deleteRelation}>
                                Delete Relation
                            </Button>
                            <Button variant="secondary" onClick={handleClose}>
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </>
            ) : (
                <></>
            )}
        </div>
    );
};

const PaddedRow = styled.div`
    padding: 4px 0;
    border-radius: 2px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) min-content min-content min-content;
`;

const SmallTag = styled(Tag)`
    font-size: 0.65rem;
    padding: 2px 2px;
    border-radius: 4px;
    color: black;
    line-height: 1;
    max-width: 14ch;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
`;
const Overflow = styled.span`
    line-height: 1;
    font-size: 0.8rem;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 7ch;
`;

export default App;
