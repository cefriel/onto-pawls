import React, { useState } from 'react';
import Select from 'react-select';
import { OntoClass } from '../../api';
// import { AnnotationStore } from '../../context';

const App = ({ list, annotationStore }: { list: OntoClass[]; annotationStore: any }) => {
    const [userChoice, setUserChoice] = useState('');
    const listLabels = list.map((ontoClass: OntoClass) => ({
        value: ontoClass.id,
        label: ontoClass.text,
    }));
    console.log('Labels in Dropdown: ', listLabels);
    console.log('dataOfOnto in Dropdown: ', list);
    const colourStyles = {
        control: (styles: any) => ({ ...styles, backgroundColor: 'white' }),
        option: (styles: any) => {
            return {
                ...styles,
                backgroundColor: 'blue',
                color: '#FFF',
                cursor: 'default',
                zIndex: 100,
            };
        },
    };
    const ontoClassFromId = (id: string) => {
        return list.find((ontoClass: OntoClass) => {
            return ontoClass.id === id;
        });
    };
    return (
        <Select
            options={listLabels}
            styles={colourStyles}
            onChange={(choice: any) => {
                const resultClass: OntoClass | undefined = ontoClassFromId(choice.value);
                setUserChoice(choice.label);
                console.log('choice.label: ', choice.label);
                console.log('Class found from id ', choice.value, ' is: ', resultClass);
                annotationStore.setActiveLabel(resultClass);
                console.log('userChoice: ', userChoice);
            }}
        />
    );
};

export default App;
