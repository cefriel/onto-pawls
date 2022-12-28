from typing import Any
from rdflib import *
import os
import json

#format_predefined = "nt"
format_predefined = "ttl"

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

    annotations = data['annotations']
    relations = data['relations']

    g = Graph()

    # declare namespaces end binding for prefixe
    kh_a = Namespace("https://knowledge.c-innovationhub.com/k-hub/annotation#")
    ex = Namespace("https://example.com#")
    dc = Namespace("http://purl.org/dc/terms/")
    g.bind("ex", ex)
    g.bind("kh-a", kh_a)
    g.bind("dc", dc)

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

def analyze_topicAnnotation(i: int, object: Any, g: Graph):
    subject = "annotation" + str(i)
    print("subject: ", subject)
    s = URIRef(ex[subject])

    print("s = ", s)

    hasPage = URIRef(kh_a["hasPage"])
    hasSnippet = URIRef(kh_a["hasSnippet"])
    hasData = URIRef(dc["created"])
    hasTopic = URIRef(kh_a["hasTopic"])

    topicAnnotation = URIRef(kh_a["TopicAnnotation"])
    page = Literal(object['page'])
    snippet = Literal(object['text'])
    dataCreation = Literal(object['date'])
    topic = URIRef(ex[object["id"]])

    g.add((s, RDF.type, topicAnnotation))
    g.add((s, hasPage, page))
    g.add((s, hasSnippet, snippet))
    g.add((s, hasData, dataCreation))
    # manca collegamento con AUTORE
    g.add((s, hasTopic, topic))
    
    analyze_annotation(object, g)

def analyze_annotation(object: Any, g: Graph):
    s = URIRef(ex[object["id"]])
    o = URIRef(object['ontoClass']['iri'])
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
        s = URIRef(get_iriResource(source_annotation))
        p = URIRef(object['ontoProperty']['iri'])
        o = URIRef(get_iriResource(target_annotation))
        
        g.add((s, p, o))





