import React, { useState, useContext, useEffect } from 'react';
import { Modal, Transfer } from '@allenai/varnish';
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
            onOk={() => {
                const sourceClasses = source
                    .filter((s) => !targetKeys.some((k) => k === s.id))
                    .map((s) => s.ontoClass.iri);
                const targetClasses = source
                    .filter((t) => targetKeys.some((k) => k === t.id))
                    .map((t) => t.ontoClass.iri);
                const sourceIds = source
                    .filter((s) => !targetKeys.some((k) => k === s.id))
                    .map((s) => s.id);
                if (!checkCompatibilityWithProperty(label, sourceClasses, targetClasses)) {
                    const text = 'Sicuro di voler creare una relazione non valida?';
                    if (confirm(text) === true) {
                        onClick(new RelationGroup(undefined, sourceIds, targetKeys, label));
                        setTargetKeys([]);
                    }
                } else {
                    onClick(new RelationGroup(undefined, sourceIds, targetKeys, label));
                    setTargetKeys([]);
                }
            }}>
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
