import React, { useState, useContext, useEffect } from 'react';
import { Modal, Transfer, notification } from '@allenai/varnish';
import Form from 'react-bootstrap/Form';
import { Annotation, RelationGroup, AnnotationStore } from '../context';
import { OntoProperty } from '../api';
import { AnnotationSummary } from './AnnotationSummary';
import DropdownOntoProperties from './sidebar/DropdownOntoProperties';

interface RelationModalProps {
    visible: boolean;
    onClick: (group: RelationGroup) => void;
    onCancel: () => void;
    source: Annotation[];
    label: OntoProperty;
}

export const RelationModal = ({
    visible,
    onClick,
    onCancel,
    source,
    label,
}: RelationModalProps) => {
    const annotationStore = useContext(AnnotationStore);
    const [targetKeys, setTargetKeys] = useState<string[]>([]);
    const transferSource = source.map((a) => ({ key: a.id, annotation: a }));
    const [propertiesCompatible, setPropertiesCompatible] = useState<OntoProperty[]>(
        annotationStore.ontoProperties
    );
    const [showAll, setShowAll] = useState<boolean>(false);

    const checkCompatibilityWithProperty = (
        p: OntoProperty,
        sourceClasses: string[],
        targetClasses: string[]
    ) => {
        return (
            (p.domain.includes(sourceClasses[0]) && p.range.includes(targetClasses[0])) ||
            (p.domain.includes(sourceClasses[0]) && p.range.length === 0) ||
            (p.domain.length === 0 && p.range.includes(targetClasses[0])) ||
            (p.domain.length === 0 && p.range.length === 0)
        );
    };

    useEffect(() => {
        if (showAll) {
            setPropertiesCompatible(annotationStore.ontoProperties);
        } else {
            const sourceClasses = source
                .filter((s) => !targetKeys.some((k) => k === s.id))
                .map((s) => s.ontoClass.iri);
            const targetClasses = source
                .filter((t) => targetKeys.some((k) => k === t.id))
                .map((t) => t.ontoClass.iri);
            const ontoPropertiesCompatible = annotationStore.ontoProperties.filter((p) =>
                checkCompatibilityWithProperty(p, sourceClasses, targetClasses)
            );
            setPropertiesCompatible(ontoPropertiesCompatible);
        }
    }, [targetKeys, showAll]);

    const createRelation = () => {
        if (propertiesCompatible.length === 0) {
            notification.warning({
                message: 'There are no properties available',
                description:
                    'Check if you did upload the correct ontology. You can also' +
                    ' toogle "Show all properties" to force the creation of the relation.',
            });
        } else {
            const sourceClasses = source
                .filter((s) => !targetKeys.some((k) => k === s.id))
                .map((s) => s.ontoClass.iri);
            const targetClasses = source
                .filter((t) => targetKeys.some((k) => k === t.id))
                .map((t) => t.ontoClass.iri);
            const sourceIds = source
                .filter((s) => !targetKeys.some((k) => k === s.id))
                .map((s) => s.id);

            if (sourceClasses.length === 0 || targetClasses.length === 0) {
                notification.warning({
                    message: 'You need to have a source and a target annotation',
                });
            } else {
                if (!checkCompatibilityWithProperty(label, sourceClasses, targetClasses)) {
                    const text =
                        'Property selected: ' +
                        label.text +
                        '. ' +
                        'Are you sure you want to create an invalid relation?';
                    if (confirm(text) === true) {
                        onClick(new RelationGroup(undefined, sourceIds, targetKeys, label));
                        setTargetKeys([]);

                        notification.success({
                            message: 'Relation created.',
                            description: 'Property used: ' + label.text,
                        });
                    }
                } else {
                    onClick(new RelationGroup(undefined, sourceIds, targetKeys, label));
                    setTargetKeys([]);
                }
            }
        }
    };

    return (
        <Modal
            title="Annotate Relations"
            width={800}
            visible={visible}
            maskClosable={true}
            onCancel={() => {
                setTargetKeys([]);
                onCancel();
            }}
            onOk={createRelation}>
            <h5>Choose a Relation</h5>
            <DropdownOntoProperties ontoProperties={propertiesCompatible}></DropdownOntoProperties>
            <br />
            <Form.Group>
                <Form.Check type={'checkbox'}>
                    <Form.Check.Input
                        type={'checkbox'}
                        defaultChecked={false}
                        onClick={(e) => {
                            setShowAll((e.target as HTMLInputElement).checked);
                        }}
                    />
                    <Form.Check.Label>Show all properties</Form.Check.Label>
                </Form.Check>
            </Form.Group>
            <Transfer
                dataSource={transferSource}
                listStyle={{ width: 300, marginTop: '20px' }}
                showSearch={false}
                targetKeys={targetKeys}
                onChange={setTargetKeys}
                render={(item) => <AnnotationSummary annotation={item.annotation} />}
            />
        </Modal>
    );
};
