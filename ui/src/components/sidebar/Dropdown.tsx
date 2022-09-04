import React, { useState } from 'react';
import Select from 'react-select';
import { Label } from '../../api';
// import { AnnotationStore } from '../../context';

const App = ({ list, annotationStore }: { list: any; annotationStore: any }) => {
    const [userChoice, setUserChoice] = useState('');
    const listLabels = list.map((onto: any) => ({ value: onto, label: onto }));
    // const labels = listLabels.map((value: any) => ({ value, label: value }));
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
    return (
        <Select
            options={listLabels}
            styles={colourStyles}
            onChange={(choice: any) => {
                const label: Label = {
                    text: choice.value,
                };
                setUserChoice(choice.value);
                console.log('choice.value: ', choice.value);
                annotationStore.setActiveLabel(label);
                console.log('label: ', label);
                console.log('userChoice: ', userChoice);
                // O "ricreo" il formato di label partendo dal nome oppure modifico annotationStore...
            }}
        />
    );
};

export default App;
