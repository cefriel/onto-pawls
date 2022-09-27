import { createContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Bounds } from './PDFStore';
import { OntoClass, OntoProperty, OntologiesNames } from '../api';

export interface TokenId {
    pageIndex: number;
    tokenIndex: number;
}

export class RelationGroup {
    constructor(
        public sourceIds: string[],
        public targetIds: string[],
        public ontoProperty: OntoProperty
    ) {}

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

        return new RelationGroup(newSourceIds, newTargetIds, this.ontoProperty);
    }

    static fromObject(obj: RelationGroup) {
        return new RelationGroup(obj.sourceIds, obj.targetIds, obj.ontoProperty);
    }
}

export class Annotation {
    public readonly id: string;

    constructor(
        public bounds: Bounds,
        public readonly page: number,
        public readonly ontoClass: OntoClass, // prima era generico: Label usato anche per Relations
        public readonly tokens: TokenId[] | null = null,
        id: string | undefined = undefined,
        public readonly text: string | null
    ) {
        this.id = id || uuidv4();
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
});
