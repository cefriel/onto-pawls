import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { OntoClass } from '../../api';

const App = ({ annotationStore }: { annotationStore: any }) => {
    const [classes, setClasses]: [classes: any, setClasses: any] = useState([]);

    useEffect(() => {
        console.log('useEffect - AnnotationStore.ontoClasses: ', annotationStore.ontoClasses);
        console.log('useEffect - AnnotationStore.ontoProperty: ', annotationStore.ontoProperties);
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
                color: 'black',
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
