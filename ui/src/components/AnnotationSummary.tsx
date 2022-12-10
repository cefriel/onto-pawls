import React, { useContext } from 'react';
import { Annotation, PDFStore, AnnotationStore } from '../context';
import { Tag } from '@allenai/varnish';
import styled from 'styled-components';
import { DeleteFilled, RightCircleOutlined } from '@ant-design/icons';

interface AnnotationSummaryProps {
    annotation: Annotation;
}

export const AnnotationSummary = ({ annotation }: AnnotationSummaryProps) => {
    const pdfStore = useContext(PDFStore);
    const annotationStore = useContext(AnnotationStore);

    const onDelete = () => {
        annotationStore.setPdfAnnotations(
            annotationStore.pdfAnnotations.deleteAnnotation(annotation)
        );
    };
    const handleScrolling = () => {
        const divPage = document.getElementById(pageInfo.page.pageNumber.toString());
        divPage?.scrollIntoView({ behavior: 'smooth' });
    };

    if (!pdfStore.pages) {
        return null;
    }

    const pageInfo = pdfStore.pages[annotation.page];

    const text =
        annotation.tokens === null
            ? 'Freeform'
            : annotation.tokens.map((t) => pageInfo.tokens[t.tokenIndex].text).join(' ');
    return (
        <PaddedRow>
            <Overflow title={text}>{text}</Overflow>
            <SmallTag title={annotation.ontoClass.text}>{annotation.ontoClass.text}</SmallTag>
            <DeleteFilled onClick={onDelete} />
            <RightCircleOutlined onClick={handleScrolling} />
        </PaddedRow>
    );
};

const PaddedRow = styled.div`
    padding: 4px 0;
    border-radius: 2px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) min-content min-content min-content;
`;

const SmallTag = styled(Tag)`
    font-size: 0.65rem;
    padding: 2px 2px;
    border-radius: 4px;
    color: black;
    line-height: 1;
    max-width: 14ch;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
`;
const Overflow = styled.span`
    line-height: 1;
    font-size: 0.8rem;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
`;
