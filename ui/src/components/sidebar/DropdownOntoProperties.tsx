import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { OntoProperty } from '../../api';

const App = ({ annotationStore }: { annotationStore: any }) => {
    const [properties, setProperties]: [properties: any, setProperties: any] = useState([]);
    useEffect(() => {
        const listLabels = annotationStore.ontoProperties.map((ontoProperty: OntoProperty) => ({
            value: ontoProperty.id,
            label: ontoProperty.text,
        }));
        setProperties(listLabels);
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
        <Select
            options={properties}
            styles={colourStyles}
            onChange={(choice: any) => {
                const resultProperty: OntoProperty | undefined = ontoPropertyFromId(choice.value);
                console.log('choice.label: ', choice.label);
                console.log('Property found from id ', choice.value, ' is: ', resultProperty);
                annotationStore.setActiveOntoProperty(resultProperty);
            }}
        />
    );
};

export default App;
