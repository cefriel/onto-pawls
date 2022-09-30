from typing import Any
from rdflib import *
import os
import json

format_predefined = "nt"

def load_annotations(path: str):
    with open(path) as f:
        blob = json.load(f)

    return blob

annotations = list()
relations = list()

def export_annotations(path: str, path_export: str):
    data = load_annotations(path)
    
    global annotations
    global relations

    annotations = data['annotations']
    relations = data['relations']

    g = Graph()

    for annotation in annotations:
        analyze_annotation(annotation, g)

    for relation in relations:
        analyze_relation(relation, g)

    path_export_with_extension = path_export+"."+format_predefined
    g.serialize(destination=path_export_with_extension, format=format_predefined)

    return os.path.abspath(path_export_with_extension)

# g.bind("resources_ep-plan", "https://w3id.org/ep-plan/resource/")
def get_iriResource(object: Any):
    base_iri = object['ontoClass']['iri'].split('#')[0]
    resource_iri = base_iri + "/resource/" + object['id']
    
    return resource_iri

def get_annotation_by_id(id: str):
    print("TEST--> annotations:", annotations)
    for annotation in annotations:
        print("INSIDE")
        if (annotation['id'] == id):
            print("annotation found by id:", annotation)
            return annotation
    
    return None

def analyze_annotation(object: Any, g: Graph):
    resource_iri = get_iriResource(object)
    s = URIRef(resource_iri)
    o = URIRef(object['ontoClass']['iri'])
    comment = Literal(object['text'])

    g.add((s, RDF.type, o))
    g.add((s, RDFS.comment, comment))

    print("\n\t s:", s, "\t o:", o )

def analyze_relation(object: Any, g: Graph):
    source_annotation_id = object['sourceIds'][0]
    target_annotation_id = object['targetIds'][0]
    print("source_annotation id: ", source_annotation_id, "\t target_annotation id: ", target_annotation_id)
    source_annotation = get_annotation_by_id(source_annotation_id)
    target_annotation = get_annotation_by_id(target_annotation_id)
    
    if source_annotation is not None and target_annotation is not None:
        print("source_annotation: ", source_annotation['id'], "\t target_annotation: ", target_annotation['id'])
        s = URIRef(get_iriResource(source_annotation))
        p = URIRef(object['ontoProperty']['iri'])
        o = URIRef(get_iriResource(target_annotation))
        
        g.add((s, p, o))





