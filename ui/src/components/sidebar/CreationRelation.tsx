import React, { useContext, useEffect, useState } from 'react';
import { AnnotationStore } from '../../context';
import Button from 'react-bootstrap/Button';
import { notification } from '@allenai/varnish';

interface Props {
    setRelationModalVisible: (state: boolean) => void;
}
const CreationRelation = ({ setRelationModalVisible }: Props) => {
    const annotationStore = useContext(AnnotationStore);
    const [showNotification, setShowNotification] = useState<boolean>(false);

    const handleChangeRelationMode = () => {
        annotationStore.setRelationMode(!annotationStore.relationMode);
        setShowNotification(true);
    };
    const handleResetRelationMode = () => {
        annotationStore.setSelectedAnnotations([]);
        annotationStore.setRelationMode(false);
        setShowNotification(false);
    };
    const handelCreationRelation = () => {
        const numberAnn = annotationStore.selectedAnnotations.length;
        if (numberAnn !== 2) {
            notification.warning({
                message: 'Can not create relatione',
                description:
                    'Remember that currently you can create a relation' +
                    ' beetween exactly 2 annotations',
            });
        } else {
            setShowNotification(false);
            setRelationModalVisible(true);
        }
    };
    useEffect(() => {
        if (showNotification === true) {
            notification.info({
                message: 'Relation Mode activated',
                description:
                    'Now you can select the annotations that you to want to be involved ' +
                    'in the relation.' +
                    ' Max annotations tha can be selected is 2.',
            });
        } else {
            notification.info({
                message: 'Relation Mode disactivated',
            });
        }
    }, [showNotification]);
    return (
        <>
            {annotationStore.relationMode && annotationStore.relationMode === true ? (
                <>
                    <Button variant="danger" className="btn m-1" onClick={handleResetRelationMode}>
                        cancel
                    </Button>
                    <Button variant="success" className="btn m-1" onClick={handelCreationRelation}>
                        done
                    </Button>
                </>
            ) : (
                <>
                    <Button
                        variant="primary"
                        className="btn m-1"
                        onClick={handleChangeRelationMode}>
                        Enable
                    </Button>
                </>
            )}
        </>
    );
};

export default CreationRelation;
