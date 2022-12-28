from typing import Optional, List
from pydantic import BaseModel


class Bounds(BaseModel):
    left: float
    top: float
    right: float
    bottom: float

#non servirà più
class Label(BaseModel):
    text: str
    # color: str

class OntoClass(BaseModel):
    id: str # serve per il rendering nei menù, lo assegnerò dal backend
    text: str # testo che verrà mostrato all'utente
    baseIri: str
    iri: str
    labelFromOwlready: str # permetterà di fare i controlli con domain/range di Relation

class OntoProperty(BaseModel):
    id: str  # serve per il rendering nei menù
    text: str  # testo che verrà mostrato all'utente
    baseIri: str
    iri: str
    labelFromOwlready: str # permetterà di fare i controlli con domain/range di Relation
    domain: List[str] # conterrà la lista degli IRI completi di modo poi di fare il check
    range: List[str] # come domain. Ricorda che potrebbero essere vuote! (in questo caso la relazione
    # è 'libera')

class OntologyData(BaseModel):
    classes: List[OntoClass]
    properties: List[OntoProperty]

class Ontology(BaseModel):
    name: str
    data: OntologyData

class TokenId(BaseModel):
    pageIndex: int
    tokenIndex: int


class Annotation(BaseModel):
    id: str
    page: int
    ontoClass: OntoClass
    date: str
    bounds: Bounds
    tokens: Optional[List[TokenId]] = None
    text: str = None


class RelationGroup(BaseModel):
    id: str
    date: str
    sourceIds: List[str]
    targetIds: List[str]
    ontoProperty: OntoProperty


class PdfAnnotation(BaseModel):
    annotations: List[Annotation]
    relations: List[RelationGroup]
