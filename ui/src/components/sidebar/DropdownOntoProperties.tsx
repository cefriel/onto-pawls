import React from 'react';
import Select from 'react-select';
import { OntoClass, OntoProperty } from '../../api';

const App = ({ list, annotationStore }: { list: OntoProperty[]; annotationStore: any }) => {
    // const [userChoice, setUserChoice] = useState('');
    const listLabels = list.map((ontoClass: OntoClass) => ({
        value: ontoClass.id,
        label: ontoClass.text,
    }));
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
    const ontoPropertyFromId = (id: string) => {
        return list.find((ontoProperty: OntoProperty) => {
            return ontoProperty.id === id;
        });
    };
    return (
        <Select
            options={listLabels}
            styles={colourStyles}
            onChange={(choice: any) => {
                const resultProperty: OntoProperty | undefined = ontoPropertyFromId(choice.value);
                // setUserChoice(choice.label);
                console.log('choice.label: ', choice.label);
                console.log('Property found from id ', choice.value, ' is: ', resultProperty);
                annotationStore.setActiveOntoProperty(resultProperty);
            }}
        />
    );
};

export default App;
