import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { OntoClass } from '../../api';

const App = ({ list, annotationStore }: { list: OntoClass[]; annotationStore: any }) => {
    // const [userChoice, setUserChoice] = useState('');
    const [classes, setClasses]: [classes: any, setClasses: any] = useState([]);
    /*
    const listLabels = list.map((ontoClass: OntoClass) => ({
        value: ontoClass.id,
        label: ontoClass.text,
    }));
    */
    console.log('list props: ', list);
    useEffect(() => {
        console.log('AnnotationStore.ontoClasses: ', annotationStore.ontoClasses);
        const listLabels = annotationStore.ontoClasses.map((ontoClass: OntoClass) => ({
            value: ontoClass.id,
            label: ontoClass.text,
        }));
        setClasses(listLabels);
    }, [annotationStore.ontoClasses]);
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
        return annotationStore.ontoClasses.find((ontoClass: OntoClass) => {
            return ontoClass.id === id;
        });
    };
    return (
        <Select
            options={classes}
            styles={colourStyles}
            onChange={(choice: any) => {
                const resultClass: OntoClass | undefined = ontoClassFromId(choice.value);
                // setUserChoice(choice.label);
                console.log('choice.label: ', choice.label);
                console.log('Class found from id ', choice.value, ' is: ', resultClass);
                annotationStore.setActiveOntoClass(resultClass);
            }}
        />
    );
};

export default App;
