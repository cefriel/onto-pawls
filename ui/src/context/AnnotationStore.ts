import { createContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Bounds } from './PDFStore';
import { OntoClass, OntoProperty, OntologiesNames } from '../api';

export interface TokenId {
    pageIndex: number;
    tokenIndex: number;
}

export interface infoRelation {
    idRelation: string;
    sourceAnnotation: Annotation | undefined;
    targetAnnotation: Annotation | undefined;
    ontoProperty: OntoProperty;
}

const getDate = () => {
    // https://stackoverflow.com/questions/23593052/format-javascript-date-as-yyyy-mm-dd?page=1&tab=scoredesc#tab-top
    const date = new Date();
    const offset = date.getTimezoneOffset();
    const range = offset * 60 * 1000;
    const today = new Date(date.getTime() - range);
    return today.toISOString().split('T')[0];
};

export class RelationGroup {
    public readonly id: string;
    public readonly date: string;
    constructor(
        id: string | undefined = undefined,
        public sourceIds: string[],
        public targetIds: string[],
        public ontoProperty: OntoProperty,
        date: string | undefined = undefined
    ) {
        this.id = id || uuidv4();
        this.date = date || getDate();
    }

    updateForAnnotationDeletion(a: Annotation): RelationGroup | undefined {
        const sourceEmpty = this.sourceIds.length === 0;
        const targetEmpty = this.targetIds.length === 0;

        const newSourceIds = this.sourceIds.filter((id) => id !== a.id);
        const newTargetIds = this.targetIds.filter((id) => id !== a.id);

        const nowSourceEmpty = this.sourceIds.length === 0;
        const nowTargetEmpty = this.targetIds.length === 0;

        // Only target had any annotations, now it has none,
        // so delete.
        if (sourceEmpty && nowTargetEmpty) {
            return undefined;
        }
        // Only source had any annotations, now it has none,
        // so delete.
        if (targetEmpty && nowSourceEmpty) {
            return undefined;
        }
        // Source was not empty, but now it is, so delete.
        if (!sourceEmpty && nowSourceEmpty) {
            return undefined;
        }
        // Target was not empty, but now it is, so delete.
        if (!targetEmpty && nowTargetEmpty) {
            return undefined;
        }

        return new RelationGroup(undefined, newSourceIds, newTargetIds, this.ontoProperty);
    }

    static fromObject(obj: RelationGroup) {
        return new RelationGroup(obj.id, obj.sourceIds, obj.targetIds, obj.ontoProperty);
    }

    updateOntoProperty(delta: Partial<RelationGroup> = {}) {
        return new RelationGroup(
            this.id,
            this.sourceIds,
            this.targetIds,
            delta.ontoProperty ?? this.ontoProperty
        );
    }
}

export class Annotation {
    public readonly id: string;
    public readonly date: string;

    constructor(
        public bounds: Bounds,
        public readonly page: number,
        public readonly ontoClass: OntoClass, // prima era generico: Label usato anche per Relations
        public readonly tokens: TokenId[] | null = null,
        id: string | undefined = undefined,
        public readonly text: string | null,
        date: string | undefined = undefined
    ) {
        this.id = id || uuidv4();
        this.date = date || getDate();
    }

    toString() {
        return this.id;
    }

    /**
     * Returns a deep copy of the provided Annotation with the applied
     * changes.
     */
    update(delta: Partial<Annotation> = {}) {
        return new Annotation(
            delta.bounds ?? Object.assign({}, this.bounds),
            delta.page ?? this.page,
            delta.ontoClass ?? Object.assign({}, this.ontoClass),
            delta.tokens ?? this.tokens?.map((t) => Object.assign({}, t)),
            this.id,
            delta.text ?? this.text
        );
    }

    static fromObject(obj: Annotation) {
        return new Annotation(obj.bounds, obj.page, obj.ontoClass, obj.tokens, obj.id, obj.text);
    }
}

export class PdfAnnotations {
    constructor(
        public readonly annotations: Annotation[],
        public readonly relations: RelationGroup[],
        public readonly unsavedChanges: boolean = false
    ) {}

    saved(): PdfAnnotations {
        return new PdfAnnotations(this.annotations, this.relations, false);
    }

    withNewAnnotation(a: Annotation): PdfAnnotations {
        return new PdfAnnotations(this.annotations.concat([a]), this.relations, true);
    }

    withNewRelation(r: RelationGroup): PdfAnnotations {
        return new PdfAnnotations(this.annotations, this.relations.concat([r]), true);
    }

    deleteAnnotation(a: Annotation): PdfAnnotations {
        const newAnnotations = this.annotations.filter((ann) => ann.id !== a.id);
        const newRelations = this.relations
            .map((r) => r.updateForAnnotationDeletion(a))
            .filter((r) => r !== undefined);
        return new PdfAnnotations(newAnnotations, newRelations as RelationGroup[], true);
    }

    deleteRelation(relation: RelationGroup): PdfAnnotations {
        const newRelations = this.relations.filter((r) => r.id !== relation.id);
        return new PdfAnnotations(this.annotations, newRelations as RelationGroup[], true);
    }

    undoAnnotation(): PdfAnnotations {
        const popped = this.annotations.pop();
        if (!popped) {
            // No annotations, nothing to update
            return this;
        }
        const newRelations = this.relations
            .map((r) => r.updateForAnnotationDeletion(popped))
            .filter((r) => r !== undefined);

        return new PdfAnnotations(this.annotations, newRelations as RelationGroup[], true);
    }

    getAnnotationsOfRelation(r: RelationGroup): infoRelation {
        const sourceAnnotation: Annotation | undefined = this.annotations.find(
            (annotation) => annotation.id === r.sourceIds[0]
            // just the first element because for now we let the creation of a relation
            // between exactly 2 annotatios
        );
        const targetAnnotation: Annotation | undefined = this.annotations.find(
            (annotation) => annotation.id === r.targetIds[0]
        );

        const result: infoRelation = {
            idRelation: r.id,
            sourceAnnotation: sourceAnnotation,
            targetAnnotation: targetAnnotation,
            ontoProperty: r.ontoProperty,
        };
        return result;
    }

    getRelationFromId(id: string): RelationGroup | undefined {
        const relation = this.relations.find((iR) => iR.id === id);
        return relation;
    }
}

interface _AnnotationStore {
    ontoNames?: OntologiesNames;
    setOntoNames: (_ontoNames: OntologiesNames) => void;

    ontoClasses: OntoClass[];
    setOntoClasses: (ontoClasses: OntoClass[]) => void;
    activeOntoClass?: OntoClass;
    setActiveOntoClass: (ontoClass: OntoClass) => void;

    ontoProperties: OntoProperty[];
    setOntoProperties: (ontoProperties: OntoProperty[]) => void;
    activeOntoProperty?: OntoProperty;
    setActiveOntoProperty: (ontoProperty: OntoProperty) => void;

    pdfAnnotations: PdfAnnotations;
    setPdfAnnotations: (t: PdfAnnotations) => void;

    selectedAnnotations: Annotation[];
    setSelectedAnnotations: (t: Annotation[]) => void;

    freeFormAnnotations: boolean;
    toggleFreeFormAnnotations: (state: boolean) => void;

    hideLabels: boolean;
    setHideLabels: (state: boolean) => void;

    relationMode: boolean;
    setRelationMode: (state: boolean) => void;
}

export const AnnotationStore = createContext<_AnnotationStore>({
    pdfAnnotations: new PdfAnnotations([], []),
    ontoNames: undefined,
    setOntoNames: (_?: OntologiesNames) => {
        throw new Error('Unimplemented');
    },
    ontoClasses: [],
    setOntoClasses: (_?: OntoClass[]) => {
        throw new Error('Unimplemented');
    },
    activeOntoClass: undefined,
    setActiveOntoClass: (_?: OntoClass) => {
        throw new Error('Unimplemented');
    },
    ontoProperties: [],
    setOntoProperties: (_?: OntoProperty[]) => {
        throw new Error('Unimplemented');
    },
    activeOntoProperty: undefined,
    setActiveOntoProperty: (_?: OntoProperty) => {
        throw new Error('Unimplemented');
    },
    selectedAnnotations: [],
    setSelectedAnnotations: (_?: Annotation[]) => {
        throw new Error('Unimplemented');
    },
    setPdfAnnotations: (_: PdfAnnotations) => {
        throw new Error('Unimplemented');
    },
    freeFormAnnotations: false,
    toggleFreeFormAnnotations: (_: boolean) => {
        throw new Error('Unimplemented');
    },
    hideLabels: false,
    setHideLabels: (_: boolean) => {
        throw new Error('Unimplemented');
    },
    relationMode: false,
    setRelationMode: (_: boolean) => {
        throw new Error('Unimplemented');
    },
});
