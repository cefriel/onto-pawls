import React, { useContext } from 'react';
import styled from 'styled-components';
import { Switch } from '@allenai/varnish';

import { AnnotationStore } from '../../context';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

import { SidebarItem, SidebarItemTitle } from './common';

import DropdownOntoClasses from './DropdownOntoClasses';
import { DownloadExportedAnnotations } from './DownloadExportedAnnotations';
import ModalPopupImportOnto from './ModalPopupImportOnto';
import ModalPopupImportDocuments from './ModalPopupImportDocuments';
import CreationRelation from './CreationRelation';

interface Props {
    sha: string;
    _setRelationModalVisible: (state: boolean) => void;
}
export const Labels = ({ sha, _setRelationModalVisible }: Props) => {
    const annotationStore = useContext(AnnotationStore);
    const onToggle = () => {
        annotationStore.toggleFreeFormAnnotations(!annotationStore.freeFormAnnotations);
    };

    return (
        <SidebarItem>
            <ModalPopupImportDocuments></ModalPopupImportDocuments>
            <ModalPopupImportOnto annotationStore={annotationStore}></ModalPopupImportOnto>
            <DownloadExportedAnnotations sha={sha}></DownloadExportedAnnotations>
            <div>
                <SidebarItemTitle>Relation Mode</SidebarItemTitle>
                <CreationRelation
                    setRelationModalVisible={_setRelationModalVisible}></CreationRelation>
            </div>
            <SidebarItemTitle>Classes</SidebarItemTitle>
            <Container>
                <div>
                    <DropdownOntoClasses annotationStore={annotationStore}></DropdownOntoClasses>
                </div>
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
