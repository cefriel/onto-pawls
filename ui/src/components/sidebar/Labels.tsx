import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { Switch } from '@allenai/varnish';

import { AnnotationStore } from '../../context';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

import { SidebarItem, SidebarItemTitle } from './common';

import Dropdown from './Dropdown';
import ModalPopup from './ModalPopup';

export const Labels = () => {
    const annotationStore = useContext(AnnotationStore);
    const [dataOfOntologies, setDataOfOntologies]: [
        dataOfOntologies: any,
        setDataOfOntologies: any
    ] = useState([]);
    const updateDataOfOntologies = (data: any) => {
        setDataOfOntologies(data);
    };
    const onToggle = () => {
        annotationStore.toggleFreeFormAnnotations(!annotationStore.freeFormAnnotations);
    };
    useEffect(() => {
        console.log('Labels useEffect - dataOfOntologies: ', dataOfOntologies);
    }, [dataOfOntologies]);

    // TODO: DISTINZIONE TRA MENU' Classes e Properties
    return (
        <SidebarItem>
            <ModalPopup updateDataOfOntologies={updateDataOfOntologies}></ModalPopup>
            <SidebarItemTitle>Classes</SidebarItemTitle>
            <Container>
                <div>
                    <Dropdown list={dataOfOntologies} annotationStore={annotationStore}></Dropdown>
                </div>
                <>
                    <SidebarItemTitle>Properties</SidebarItemTitle>
                    <div>
                        <Dropdown
                            list={dataOfOntologies}
                            annotationStore={annotationStore}></Dropdown>
                    </div>
                </>
                <div>
                    Free Form Annotations
                    <Toggle
                        size="small"
                        onChange={onToggle}
                        checkedChildren={<CheckOutlined />}
                        unCheckedChildren={<CloseOutlined />}
                    />
                </div>
            </Container>
        </SidebarItem>
    );
};

const Toggle = styled(Switch)`
    margin: 4px;
`;

const Container = styled.div(
    ({ theme }) => `
   margin-top: ${theme.spacing.sm};
   div + div {
       margin-top: ${theme.spacing.md};
   }

`
);
