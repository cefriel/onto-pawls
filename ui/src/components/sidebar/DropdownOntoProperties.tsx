import React, { useState, useEffect, useContext } from 'react';
import Select from 'react-select';
import { AnnotationStore } from '../../context';
import { OntoProperty } from '../../api';

interface DropdownPropertiesProps {
    ontoProperties: OntoProperty[];
}
const App = ({ ontoProperties }: DropdownPropertiesProps) => {
    const annotationStore = useContext(AnnotationStore);
    const [properties, setProperties]: [properties: any, setProperties: any] = useState([]);
    useEffect(() => {
        const listLabels = ontoProperties.map((ontoProperty: OntoProperty) => ({
            value: ontoProperty.id,
            label: ontoProperty.text,
        }));
        setProperties(listLabels);
    }, [ontoProperties]);
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
        return ontoProperties.find((ontoProperty: OntoProperty) => {
            return ontoProperty.id === id;
        });
    };
    return (
        <Select
            options={properties}
            styles={colourStyles}
            onChange={(choice: any) => {
                const resultProperty: OntoProperty | undefined = ontoPropertyFromId(choice.value);
                console.log('choice.label: ', choice.label);
                console.log('Property found from id ', choice.value, ' is: ', resultProperty);
                if (resultProperty !== undefined) {
                    annotationStore.setActiveOntoProperty(resultProperty);
                }
            }}
        />
    );
};

export default App;
