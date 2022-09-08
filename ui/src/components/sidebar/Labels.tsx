import React, { useContext } from 'react';
import styled from 'styled-components';
import { Switch } from '@allenai/varnish';

import { AnnotationStore } from '../../context';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

import { SidebarItem, SidebarItemTitle } from './common';

import DropdownOntoClasses from './DropdownOntoClasses';
import DropdownOntoProperties from './DropdownOntoProperties';
import ModalPopup from './ModalPopup';

export const Labels = () => {
    const annotationStore = useContext(AnnotationStore);
    const onToggle = () => {
        annotationStore.toggleFreeFormAnnotations(!annotationStore.freeFormAnnotations);
    };

    // TODO: DISTINZIONE TRA MENU' Classes e Properties
    return (
        <SidebarItem>
            <ModalPopup annotationStore={annotationStore}></ModalPopup>
            <SidebarItemTitle>Classes</SidebarItemTitle>
            <Container>
                <div>
                    <DropdownOntoClasses
                        list={annotationStore.ontoClasses}
                        annotationStore={annotationStore}></DropdownOntoClasses>
                </div>
                <>
                    <SidebarItemTitle>Properties</SidebarItemTitle>
                    <div>
                        <DropdownOntoProperties
                            list={annotationStore.ontoProperties}
                            annotationStore={annotationStore}></DropdownOntoProperties>
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
