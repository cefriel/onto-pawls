from owlready2 import *
#Estensioni supportate: N-Triples, RDF/XML, OWL/XML
#Da capire perchè gli output escono come: C:\Users\youss\progettoTesi\owlready2\ontologie\ep-plan.xml.isVariableOfPlan
#Qaundo invece è un riferimento ad un'ontologia importata: p-plan.isVariableOfPlan

onto = get_ontology("file://C:\\Users\\youss\\progettoTesi\\owlready2\\ontologie\\p_plan.owl").load() # --ok
#onto = get_ontology("file://C:\\Users\\youss\\progettoTesi\\owlready2\\ontologie\\p_plan.rdf").load() # --ok
#onto = get_ontology("file://C:\\Users\\youss\\progettoTesi\\owlready2\\ontologie\\ep-plan.nt").load() # --ok 
#onto = get_ontology("file://C:\\Users\\youss\\progettoTesi\\owlready2\\ontologie\\ep-plan.xml").load() # --ok 

labels = set()

prov = onto.get_namespace("http://www.w3.org/ns/prov")
print("Namespace diverso: ", prov.Plan.iri)

def render(entity):
    label = entity.label.first() #soltanto con p_pan le prop. vengono del tipo C:\Users\...\ontologie\p_plan.correspondsToStep
    #label = entity.name
    if label == None:
        return entity
    return label
    #return entity.is_a
    #return entity.name  #ottengo i nomi correttamente, rimane un problema: non ci riesce a fare distinzione tra nomi uguali di label appartenenti a 
                        #ontologie diverse (es. PLAN è sia di p_plan che di prov_o)

for entity in onto.classes():
    print("->Entity: ", entity)
    rendered = render(entity)

    print(rendered)
    #search = onto.search(label = render(entity))
    search = list(default_world.sparql("""
           SELECT ?x
           { ?x rdfs:label ?? . }
           """, [rendered])) #Result of search is a list: [[el1], [eel2], ...]

    

    if len(search) > 0:
        el = search[0]
        text = "\t->Search: iri... %s \tName... %s"%(el[0].iri, el[0].name)
        print(text, "\tIRIS: ", IRIS[el[0].iri])
    else:
        print("\tNothing Found!")
######################################
"""
print("\n***************\n")
#ok
for data_property in list(onto.data_properties()):
    print(render(data_property), "\tDomain: ", data_property.domain,"\tRange: ", data_property.range)    
#ok
for object_properties in list(onto.object_properties()):
    print(render(object_properties), "\tDomain: ", object_properties.domain,"\tRange: ", object_properties.range)   

print("\n***************\n")

print("*** IRI ***")
print(onto.base_iri)

print("*** METADATA ***")
print(onto.metadata.comment)

print("\n*** Classe: PLAN ***")
print(onto.Plan)

print("\n*** CLASSI ***")
for classe in list(onto.classes()):
    print("-> ", classe)

print("\n*** PROPRIETA' ***")
for classe in onto.properties():
    print("-> ", classe)

print("\n*** classes() ***")
print(list(onto.classes()))
"""
print("\n*** SPARQL ***")
print( list(default_world.sparql("""
           SELECT ?x
           { ?x a owl:Class . }
    """)) )

search = list(default_world.sparql("""
           SELECT ?x ?y
           { ?x rdfs:comment ?y . }
           """))
print("\nComments: ", search)
print("\nImported Ontologies", onto.imported_ontologies)
print("base IRI", onto.base_iri)
