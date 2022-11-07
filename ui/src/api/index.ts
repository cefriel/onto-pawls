import axios from 'axios';
import { Annotation, RelationGroup, PdfAnnotations } from '../context';

export interface Token {
    x: number;
    y: number;
    height: number;
    width: number;
    text: string;
}

interface Page {
    index: number;
    width: number;
    height: number;
}

export interface PageTokens {
    page: Page;
    tokens: Token[];
}

export interface OntologiesNames {
    ontologiesNames: string[];
}

export interface DocumentsNames {
    documentsNames: string[];
}

export interface PaperStatus {
    sha: string;
    name: string;
    annotations: number;
    relations: number;
    finished: boolean;
    junk: boolean;
    comments: string;
    completedAt?: Date;
}

export interface Allocation {
    papers: PaperStatus[];
    hasAllocatedPapers: boolean;
}

export interface OntoClass {
    id: string; // serve per il rendering nei menù, lo assegnerò dal backend
    text: string; // testo che verrà mostrato all'utente
    baseIri: string;
    iri: string;
    labelFromOwlready: string; // permetterà di fare i controlli con domain/range di Relation
}

export interface OntoProperty {
    id: string; // serve per il rendering nei menù
    text: string; // testo che verrà mostrato all'utente
    baseIri: string;
    iri: string;
    labelFromOwlready: string; // permetterà di fare i controlli con domain/range di Relation
    domain: string[]; // conterrà la lista degli IRI completi di modo poi di fare il check
    range: string[]; // come domain. Ricorda che potrebbero essere vuote! (in questo caso la relazione
    // è 'libera')
}

function docURL(sha: string): string {
    return `/api/doc/${sha}`;
}

export function pdfURL(sha: string): string {
    return `${docURL(sha)}/pdf`;
}

export async function getTokens(sha: string): Promise<PageTokens[]> {
    return axios.get(`${docURL(sha)}/tokens`).then((r) => r.data);
}

export async function getClasses(_ontologiesNames: OntologiesNames) {
    const ontoNames: string[] = _ontologiesNames.ontologiesNames;
    try {
        const response = await axios({
            method: 'post',
            url: '/api/annotation/classes',
            data: ontoNames,
        });
        // console.log('response data: ', response.data);
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export async function getProperties(_ontologiesNames: OntologiesNames) {
    const ontoNames: string[] = _ontologiesNames.ontologiesNames;
    try {
        const response = await axios({
            method: 'post',
            url: '/api/annotation/properties',
            data: ontoNames,
        });
        // console.log('response data: ', response.data);
        return response.data;
    } catch (error) {
        console.log(error);
    }
}

export async function setPdfComment(sha: string, comments: string) {
    return axios.post(`/api/doc/${sha}/comments`, comments);
}

export async function setPdfFinished(sha: string, finished: boolean) {
    return axios.post(`/api/doc/${sha}/finished`, finished);
}

export async function setPdfJunk(sha: string, junk: boolean) {
    return axios.post(`/api/doc/${sha}/junk`, junk);
}

export async function getAllocatedPaperStatus(): Promise<Allocation> {
    return axios.get('/api/annotation/allocation/info').then((r) => r.data);
}

export function saveAnnotations(sha: string, pdfAnnotations: PdfAnnotations): Promise<any> {
    // console.log('pdfAnnotations.annotations: ', pdfAnnotations.annotations);
    // console.log('pdfAnnotations.relations: ', pdfAnnotations.relations);
    return axios.post(`/api/doc/${sha}/annotations`, {
        annotations: pdfAnnotations.annotations,
        relations: pdfAnnotations.relations,
    });
}

export async function getAnnotations(sha: string): Promise<PdfAnnotations> {
    return axios.get(`/api/doc/${sha}/annotations`).then((response) => {
        const ann: PdfAnnotations = response.data;
        const annotations = ann.annotations.map((a) => Annotation.fromObject(a));
        const relations = ann.relations.map((r) => RelationGroup.fromObject(r));

        return new PdfAnnotations(annotations, relations);
    });
}

export async function uploadOntology(file: FormData) {
    console.log('File in uploadOntology: ', file);
    try {
        const response = await axios({
            method: 'post',
            url: '/api/upload/ontology',
            data: file,
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        // console.log('response: ', response);
        return response;
    } catch (error) {
        console.log(error);
    }
}

export async function deleteFile(filename: string) {
    axios
        .delete(`/api/ontology/${filename}`)
        .then((res) => {
            console.log(res);
        })
        .catch((err) => console.error(err));
}

export async function getNamesOfOntologiesAlreadyUploaded(): Promise<OntologiesNames> {
    return await axios
        .get('/api/ontology/names')
        .then((r) => r.data)
        .catch((err) => console.log(err));
}

export async function getNamesOfDocumentsAlreadyUploaded(): Promise<DocumentsNames> {
    return await axios
        .get('/api/doc/names')
        .then((r) => r.data)
        .catch((err) => console.log(err));
}

export async function exportAnnotations(sha: string) {
    return axios.get(`/api/annotation/${sha}/export`, {
        responseType: 'blob',
        /* 
            headers: {
            Authorization: 'Bearer <token>', // add authentication information as required by the backend APIs.
            },
        */
    });
}
