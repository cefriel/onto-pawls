import React, { useState } from 'react';
import Select from 'react-select';
import { Label } from '../../api';
// import { AnnotationStore } from '../../context';

const App = ({ list, annotationStore }: { list: any; annotationStore: any }) => {
    const [userChoice, setUserChoice] = useState('');
    const listLabels = list.map((label: Label) => label.text);
    const labels = listLabels.map((value: any) => ({ value, label: value }));
    console.log(labels);
    return (
        <Select
            options={labels}
            onChange={(choice: any) => {
                setUserChoice(choice.value);
                console.log('choice value: ', choice.value);
                annotationStore.setActiveLabel(userChoice);
                // O "ricreo" il formato di label partendo dal nome oppure modifico annotationStore...
            }}
        />
    );
};

export default App;
