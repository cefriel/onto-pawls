from typing import Any
from rdflib import *
import os
import json
import uuid

#format_predefined = "nt"
format_predefined = "ttl"

format_document = "pdf"

default_user = "ontopawls"

def load_annotations(path: str):
    with open(path) as f:
        blob = json.load(f)

    return blob

annotations = list()
relations = list()

def export_annotations(
    annotationPath: str,
    path_export: str,
    title: str,
    documentPath: str,
    npages: int
):
    # servono alcuni dati del pdf:
    # titolo, #pagine_totali, url
    
    data = load_annotations(annotationPath)

    global annotations
    global relations
    global kh_a
    global ex
    global dc

    global subject_document
    global user 

    global user_ontologies

    annotations = data['annotations']
    relations = data['relations']

    g = Graph()
    user_ontologies = {}

    # declare namespaces end binding for prefix
    kh_a = Namespace("https://knowledge.c-innovationhub.com/k-hub/annotation#")
    ex = Namespace("https://example.com#")
    dc = Namespace("http://purl.org/dc/terms/")
    # DC from rdflib doesn't have the property created => we do the manual binding

    g.bind("ex", ex)
    g.bind("kh-a", kh_a)
    g.bind("dc", dc)
    g.bind("foaf", FOAF)
    g.bind("provo", PROV)

    user = ex["utente"]

    # metadata about the user 
    g.add((user, RDF.type, PROV.agent))
    g.add((user, FOAF.name, Literal(default_user)))

    # metadata about document pdf
    subject_document = analyze_document(title, documentPath, npages, g)

    # populate the graph
    for i in range(len(annotations)):
        analyze_topicAnnotation(i, annotations[i], g)

    for relation in relations:
        analyze_relation(relation, g)
    
    # export to file
    path_export_with_extension = path_export+"."+format_predefined

    g.serialize(destination=path_export_with_extension, format=format_predefined)
    os.chmod(path_export_with_extension, 0o777)

    return os.path.abspath(path_export_with_extension)

def get_annotation_by_id(id: str):
    for annotation in annotations:
        if (annotation['id'] == id):
            return annotation
    
    return None

def analyze_document(title: str, documentPath: str, npages: int, g: Graph):
    id_document=str(uuid.uuid4())
    subject_document = URIRef(ex[id_document])
    
    g.add((subject_document, RDF.type, FOAF.Document))
    g.add((subject_document, dc["title"], Literal(title)))
    g.add((subject_document, dc["format"], Literal(format_document)))
    g.add((subject_document, dc["source"], Literal(documentPath)))
    g.add((subject_document, kh_a["hasTotalNumberOfPages"], Literal(npages)))

    return subject_document

def analyze_topicAnnotation(i: int, object: Any, g: Graph):
    subject = "annotation" + str(i)
    print("subject: ", subject)
    s = URIRef(ex[subject])
    
    hasPage = URIRef(kh_a["hasPage"])
    hasSnippet = URIRef(kh_a["hasSnippet"])
    hasData = URIRef(dc["created"])
    hasTopic = URIRef(kh_a["hasTopic"])

    topicAnnotation = URIRef(kh_a["TopicAnnotation"])
    # number of page starts counting from zero
    page = Literal(object['page'] + 1)
    snippet = Literal(object['text'])
    dataCreation = Literal(object['date'])
    topic = URIRef(ex[object["id"]])

    g.add((s, RDF.type, topicAnnotation))
    g.add((s, hasPage, page))
    g.add((s, hasSnippet, snippet))
    g.add((s, hasData, dataCreation))
    # manca collegamento con AUTORE
    g.add((s, hasTopic, topic))
    g.add((s, PROV.wasAttributedTo, user))

    g.add((subject_document, kh_a["hasTopicAnnotation"], s))

    analyze_annotation(object, g)

def getUrirefUserOntology(iri: str, g: Graph):
    print("IRI: ", iri)
    print("initial user_ontologies: ", user_ontologies)
    if "#" in iri:
        baseIri = iri.split("#")[0]
        element = iri.split("#")[-1]
        print("# is in iri. BaseIri=", baseIri)
        if baseIri in user_ontologies:
            return user_ontologies[baseIri], element
        else:
            nameOnto = baseIri.split("/")[-1]
            print("nameOnto = ", nameOnto)
            ns = Namespace(baseIri)
            user_ontologies.update({baseIri: URIRef(ns)})
            g.bind(nameOnto, ns)
            print("final user_ontologies: ", user_ontologies, " type: ", type(user_ontologies[baseIri]))

            return user_ontologies[baseIri], element
    else:
        baseIri = iri.rsplit('/', 1)[0]
        element = iri.split("/")[-1]
        if baseIri in user_ontologies:
            return user_ontologies[baseIri], element
        else:
            nameOnto = iri.split("/")[-1]
            ns = Namespace(baseIri)
            user_ontologies.update({baseIri: URIRef(ns)})
            g.bind(nameOnto, ns)

            return user_ontologies[baseIri], element

def analyze_annotation(object: Any, g: Graph):
    s = URIRef(ex[object["id"]])
    o = URIRef(object['ontoClass']['iri'])

    #object_uriref, nameClass = getUrirefUserOntology(object['ontoClass']['iri'], g)

    comment = Literal(object['text'])
    
    g.add((s, RDF.type, o))
    g.add((s, RDFS.comment, comment))

def analyze_relation(object: Any, g: Graph):
    source_annotation_id = object['sourceIds'][0]
    target_annotation_id = object['targetIds'][0]

    source_annotation = get_annotation_by_id(source_annotation_id)
    target_annotation = get_annotation_by_id(target_annotation_id)
    
    if source_annotation is not None and target_annotation is not None:
        print("source_annotation: ", source_annotation['id'], "\t target_annotation: ", target_annotation['id'])
        s = URIRef(ex[source_annotation_id])
        p = URIRef(object['ontoProperty']['iri'])
        o = URIRef(ex[target_annotation_id])
        
        g.add((s, p, o))





