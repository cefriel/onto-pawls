import React, { useContext } from 'react';
import { SidebarItem, SidebarItemTitle } from './common';
import { Annotation, RelationGroup, AnnotationStore } from '../../context';
import ModalPopupRelationInfo from './ModalPopupRelationInfo';

interface RelationProps {
    annotations: Annotation[];
    relations: RelationGroup[];
}

export const Relations = ({ annotations, relations }: RelationProps) => {
    const annotationStore = useContext(AnnotationStore);
    console.log('Annotations-props: ', annotations);
    console.log('Annotations-context: ', annotationStore.pdfAnnotations.annotations);
    relations.map((relation) =>
        console.log(
            'Relation info: ',
            annotationStore.pdfAnnotations.getAnnotationsOfRelation(relation)
        )
    );
    return (
        <SidebarItem>
            <SidebarItemTitle>Relations</SidebarItemTitle>
            {relations.length === 0 ? (
                <>None</>
            ) : (
                <>
                    {relations.map((relation) => (
                        <>
                            <ModalPopupRelationInfo relation={relation}></ModalPopupRelationInfo>
                        </>
                    ))}
                </>
            )}
        </SidebarItem>
    );
};
