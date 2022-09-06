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
    useEffect(() => {
        const onKeyPress = (e: KeyboardEvent) => {
            // Numeric keys 1-9
            if (e.keyCode >= 49 && e.keyCode <= 57) {
                const index = Number.parseInt(e.key) - 1;
                if (index < annotationStore.labels.length) {
                    annotationStore.setActiveLabel(annotationStore.labels[index]);
                }
            }
            // Left/Right Arrow keys
            if (e.keyCode === 37 || e.keyCode === 39) {
                if (!annotationStore.activeLabel) {
                    annotationStore.setActiveLabel(annotationStore.labels[0]);
                    return;
                }
                const currentIndex = annotationStore.labels.indexOf(annotationStore.activeLabel);
                // Right goes forward
                let next =
                    currentIndex === annotationStore.labels.length - 1 ? 0 : currentIndex + 1;
                // Left goes backward
                if (e.keyCode === 37) {
                    next =
                        currentIndex === 0 ? annotationStore.labels.length - 1 : currentIndex - 1;
                }
                annotationStore.setActiveLabel(annotationStore.labels[next]);
            }
        };
        window.addEventListener('keydown', onKeyPress);
        return () => {
            window.removeEventListener('keydown', onKeyPress);
        };
    }, [annotationStore]);

    // TODO(Mark): Style the tags so it's clear you can select them with the numeric keys.
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
