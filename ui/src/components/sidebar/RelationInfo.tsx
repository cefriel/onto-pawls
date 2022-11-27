import React, { useState, useContext, useEffect } from 'react';
import { infoRelation, AnnotationStore } from '../../context';
import { EditFilled } from '@ant-design/icons';
import { OntoProperty } from '../../api';
import Select from 'react-select';

interface RelationInfoProps {
    info: infoRelation;
}
export const RelationInfo = ({ info }: RelationInfoProps) => {
    const annotationStore = useContext(AnnotationStore);
    const [modifyPropertyClass, setModifyPropertyClass] = useState(false);
    const [properties, setProperties]: [properties: any, setProperties: any] = useState([]);
    const [iRelationInfoInListPropeprties, setIRelationInfoInListPropeprties] = useState<number>(0);
    const setNewProperty = useState<OntoProperty>()[1];
    useEffect(() => {
        const listLabels = annotationStore.ontoProperties.map((ontoProperty: OntoProperty) => ({
            value: ontoProperty.id,
            label: ontoProperty.text,
        }));
        setProperties(listLabels);
        const indexRelationInfo = listLabels.findIndex((r) => r.label === info.ontoProperty.text);
        // al momento non si fa il controllo dell'id poichè se un'ontologia viene eliminata
        // e poi ricaricata => verranno assegnati nuovi id alle classi => si perde la coerenza tra
        // gli id delle classi delle annotazioni e degli id delle classi dell'ontologia.
        // Il problema non si porrà nel caso si decide che le ontologie non si possono eliminare
        console.log('Indice: ', indexRelationInfo, ' => ', listLabels[indexRelationInfo]);
        if (indexRelationInfo !== undefined || indexRelationInfo >= 0) {
            setIRelationInfoInListPropeprties(indexRelationInfo);
        }
    }, [annotationStore.ontoProperties]);
    const colourStyles = {
        control: (styles: any) => ({ ...styles, backgroundColor: 'white' }),
        option: (styles: any) => {
            return {
                ...styles,
                color: 'black',
                cursor: 'default',
                zIndex: 100,
            };
        },
    };
    const ontoPropertyFromId = (id: string) => {
        return annotationStore.ontoProperties.find((ontoProperty: OntoProperty) => {
            return ontoProperty.id === id;
        });
    };
    return (
        <>
            {info.sourceAnnotation !== undefined && info.targetAnnotation !== undefined ? (
                <>
                    <h4>Source Annotation</h4>
                    <p>
                        <b>ID</b>: {info.sourceAnnotation.toString()}
                    </p>
                    <p>
                        <b>Class</b>: {info.sourceAnnotation.ontoClass.text}
                    </p>
                    <p>
                        <b>Text</b>: {info.sourceAnnotation.text}
                    </p>
                    <p>
                        <b>Page</b>: {info.sourceAnnotation.page}
                    </p>
                    <hr></hr>
                    <h4>Target Annotation</h4>
                    <p>
                        <b>ID</b>: {info.targetAnnotation.toString()}
                    </p>
                    <p>
                        <b>Class</b>: {info.targetAnnotation.ontoClass.text}
                    </p>
                    <p>
                        <b>Text</b>: {info.targetAnnotation.text}
                    </p>
                    <p>
                        <b>Page</b>: {info.targetAnnotation.page}
                    </p>
                    <hr></hr>
                    <h4>Relation details</h4>
                    <div>
                        <b>Property</b>:
                        {modifyPropertyClass ? (
                            <>
                                <Select
                                    options={properties}
                                    defaultValue={properties[iRelationInfoInListPropeprties]}
                                    styles={colourStyles}
                                    onChange={(choice: any) => {
                                        console.log('choice v:', choice.value);
                                        const resultProperty:
                                            | OntoProperty
                                            | undefined = ontoPropertyFromId(choice.value);
                                        const _relation = annotationStore.pdfAnnotations.getRelationFromId(
                                            info.idRelation
                                        );
                                        console.log('resultProperty:', resultProperty);
                                        if (
                                            resultProperty !== undefined &&
                                            _relation !== undefined
                                        ) {
                                            setNewProperty(resultProperty);
                                            console.log(
                                                'Relation before updating ontoProp: ',
                                                _relation
                                            );
                                            annotationStore.setPdfAnnotations(
                                                annotationStore.pdfAnnotations
                                                    .deleteRelation(_relation)
                                                    .withNewRelation(
                                                        _relation.updateOntoProperty({
                                                            ontoProperty: resultProperty,
                                                        })
                                                    )
                                            );
                                            console.log('Relation updated: ', _relation);
                                        }
                                    }}
                                />
                            </>
                        ) : (
                            <>
                                {info.ontoProperty.text}
                                <EditFilled
                                    onClick={() => {
                                        setModifyPropertyClass(true);
                                    }}
                                />
                            </>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <p>Error!</p>
                </>
            )}
        </>
    );
};
