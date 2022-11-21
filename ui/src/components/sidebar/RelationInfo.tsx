import React from 'react';
import { infoRelation } from '../../context';

interface RelationInfoProps {
    info: infoRelation;
}
export const RelationInfo = ({ info }: RelationInfoProps) => {
    return (
        <>
            {info.sourceAnnotation !== undefined && info.targetAnnotation !== undefined ? (
                <>
                    <p>
                        <b>Source annotation ID</b>: {info.sourceAnnotation.toString()}
                    </p>
                    <p>
                        <b>Class</b>: {info.sourceAnnotation.ontoClass.text}
                    </p>
                    <p>
                        <b>Text</b>: {info.sourceAnnotation.text}
                    </p>
                    <p>//////////////////////////</p>
                    <p>
                        <b>Target annotation ID</b>: {info.targetAnnotation.toString()}
                    </p>
                    <p>
                        <b>Class</b>: {info.targetAnnotation.ontoClass.text}
                    </p>
                    <p>
                        <b>Text</b>: {info.targetAnnotation.text}
                    </p>
                    <p>//////////////////////////</p>
                    <p>
                        <b>Property</b>: {info.ontoProperty.text}
                    </p>
                </>
            ) : (
                <>
                    <p>Error!</p>
                </>
            )}
        </>
    );
};
