from fileinput import filename
from tkinter.tix import Form
from typing import List, Optional, Dict, Any
import logging
import os
import json
import glob
import uuid
from urllib import request
from pathlib import Path
from typing import Union
import shutil

from owlready2 import *
from rdflib import Graph

from fastapi import FastAPI, HTTPException, Header, Response, Body, Form, File, UploadFile, Query
from fastapi.responses import FileResponse
from fastapi.encoders import jsonable_encoder

from app.metadata import PaperStatus, Allocation
from app.annotations import Annotation, OntoClass, OntoProperty, RelationGroup, PdfAnnotation, OntologyData, Ontology
from app.utils import StackdriverJsonFormatter
from app.preprocess import preprocess
from app.assign import assign
from app import pre_serve, export

IN_PRODUCTION = os.getenv("IN_PRODUCTION", "dev")

CONFIGURATION_FILE = os.getenv(
    "PAWLS_CONFIGURATION_FILE", "/usr/local/src/skiff/app/api/config/configuration.json"
)

handlers = None

if IN_PRODUCTION == "prod":
    json_handler = logging.StreamHandler()
    json_handler.setFormatter(StackdriverJsonFormatter())
    handlers = [json_handler]

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", default=logging.INFO), handlers=handlers
)
logger = logging.getLogger("uvicorn")

# boto3 logging is _super_ verbose.
logging.getLogger("boto3").setLevel(logging.CRITICAL)
logging.getLogger("botocore").setLevel(logging.CRITICAL)
logging.getLogger("nose").setLevel(logging.CRITICAL)
logging.getLogger("s3transfer").setLevel(logging.CRITICAL)

# The annotation app requires a bit of set up.
configuration = pre_serve.load_configuration(CONFIGURATION_FILE)

app = FastAPI()


def get_user_from_header(user_email: Optional[str]) -> Optional[str]:
    """
    Call this function with the X-Auth-Request-Email header value. This must
    include an "@" in its value.

    * In production, this is provided by Skiff after the user authenticates.
    * In development, it is provided in the NGINX proxy configuration file local.conf.

    If the value isn't well formed, or the user isn't allowed, an exception is
    thrown.
    """
    if "@" not in user_email:
        raise HTTPException(403, "Forbidden")

    if not user_is_allowed(user_email):
        raise HTTPException(403, "Forbidden")

    return user_email


def user_is_allowed(user_email: str) -> bool:
    """
    Return True if the user_email is in the users file, False otherwise.
    """
    try:
        with open(configuration.users_file) as file:
            for line in file:
                entry = line.strip()
                if user_email == entry:
                    return True
                # entries like "@allenai.org" mean anyone in that domain @allenai.org is granted access
                if entry.startswith("@") and user_email.endswith(entry):
                    return True
    except FileNotFoundError:
        logger.warning("file not found: %s", configuration.users_file)
        pass

    return False


def all_pdf_shas() -> List[str]:
    pdfs = glob.glob(f"{configuration.output_directory}/*/*.pdf")
    return [p.split("/")[-2] for p in pdfs]


def update_status_json(status_path: str, sha: str, data: Dict[str, Any]):

    with open(status_path, "r+") as st:
        status_json = json.load(st)
        status_json[sha] = {**status_json[sha], **data}
        st.seek(0)
        json.dump(status_json, st)
        st.truncate()

def renderLabelsOfOntology(entity):
    """
    if label == None:
        return entity
    return label
    """
    return str(entity)

def getClassesAndPropertiesFromJsonOntology(filename: str) -> OntologyData:
    file_location = os.path.join(configuration.extracted_data_from_ontology_directory, f"{filename}.json")
    classesResult: Any
    propertiesResult: Any
    exists = os.path.exists(file_location)
    if not exists:
        return {"classes": [], "properties": []}
    else: 
        with open(file_location) as f:
            onto = json.load(f)

        classesResult = onto['data']['classes']
        propertiesResult = onto['data']['properties']

    return {"classes": classesResult, "properties": propertiesResult}

def analyze_ontology(path: str) -> OntologyData:  
    #https://owlready2.readthedocs.io/en/v0.37/onto.html -> Loading an ontology from OWL files

    g = Graph()

    classes_result = list() 
    properties_result = list()

    path_onto = os.path.join("file://", f"{path}")
    onto = get_ontology(path_onto).load() 

    g.parse(path_onto)
    prop_domain = {}
    prop_range = {}


    #getting all the possible domain for all properties
    q = """
        prefix rdf:   <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        prefix owl:   <http://www.w3.org/2002/07/owl#>
        prefix xsd:   <http://www.w3.org/2001/XMLSchema#>
        prefix rdfs:  <http://www.w3.org/2000/01/rdf-schema#>

        select ?p ?d where {
            ?p rdfs:domain/(owl:unionOf/rdf:rest*/rdf:first)* ?d
            filter isIri(?d)
        }
    """
    for r in g.query(q):
        if prop_domain.get(str(r["p"])) is not None:
            prop_domain.get(str(r["p"])).append(str(r["d"]))
        else:
            prop_domain[str(r["p"])] = [str(r["d"])]

    #getting all the possible range for all properties
    q = """
        prefix rdf:   <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        prefix owl:   <http://www.w3.org/2002/07/owl#>
        prefix xsd:   <http://www.w3.org/2001/XMLSchema#>
        prefix rdfs:  <http://www.w3.org/2000/01/rdf-schema#>

        select ?p ?d where {
            ?p rdfs:range/(owl:unionOf/rdf:rest*/rdf:first)* ?d
            filter isIri(?d)
        }
    """
    for r in g.query(q):
        if prop_range.get(str(r["p"])) is not None:
            prop_range.get(str(r["p"])).append(str(r["d"]))
        else:
            prop_range[str(r["p"])] = [str(r["d"])]
    ##############################################

    def extractNameFromIri(entity):
        return entity.iri.rsplit('/', 1)[-1]

    def getClasses():
        colors = ["#FF0000", "#EFDDF5", "#CEEBFC", "#FFDA77", "#A8DDA8", "#B8DE6F", "#70DDBA", "#C6CC82"]
        current_i_color = 0
        
        for entity in onto.classes():
            className = extractNameFromIri(entity)

            ontoClass = OntoClass(
                id=str(uuid.uuid4()),
                text=className,
                baseIri=onto.base_iri,
                iri=entity.iri,
                labelFromOwlready=str(entity),
                color=""
            )

            if current_i_color == len(colors):
                current_i_color = 0
                ontoClass.color = colors[current_i_color]
                current_i_color += 1
            else:
                ontoClass.color = colors[current_i_color]
                current_i_color += 1

            classes_result.append(ontoClass)

    def getProperties():
        for data_property in list(onto.data_properties()):
            propertyName = extractNameFromIri(data_property)

            ontoProperty = OntoProperty(
                id=str(uuid.uuid4()),
                text=propertyName,
                baseIri=onto.base_iri,
                iri=data_property.iri,
                labelFromOwlready=str(data_property),
                domain=prop_domain.get(data_property.iri, []),
                range=prop_range.get(data_property.iri, [])
            )

            properties_result.append(ontoProperty)

        for object_property in list(onto.object_properties()):
            propertyName = extractNameFromIri(object_property)

            ontoProperty = OntoProperty(
                id=str(uuid.uuid4()),
                text=propertyName,
                baseIri=onto.base_iri,
                iri=object_property.iri,
                labelFromOwlready=str(object_property),
                domain=prop_domain.get(object_property.iri, []),
                range=prop_range.get(object_property.iri, [])
            )

            properties_result.append(ontoProperty)

    getClasses()
    getProperties()

    json_classes = [jsonable_encoder(c) for c in classes_result]
    json_properties = [jsonable_encoder(p) for p in properties_result]

    return {"classes": json_classes, "properties": json_properties}

def saveOntologyDataToJson(ontology: Ontology, name: str):
    path = os.path.join(configuration.extracted_data_from_ontology_directory, f"{name}.json")
    with open(path, "w+") as f:
        json.dump(ontology, f)

@app.get("/", status_code=204)
def read_root():
    """
    Skiff's sonar, and the Kubernetes health check, require
    that the server returns a 2XX response from it's
    root URL, so it can tell the service is ready for requests.
    """
    return Response(status_code=204)


@app.get("/api/doc/{sha}/pdf")
async def get_pdf(sha: str):
    """
    Fetches a PDF.

    sha: str
        The sha of the pdf to return.
    """
    pdf = os.path.join(configuration.output_directory, sha, f"{sha}.pdf")
    pdf_exists = os.path.exists(pdf)
    if not pdf_exists:
        raise HTTPException(status_code=404, detail=f"pdf {sha} not found.")

    return FileResponse(pdf, media_type="application/pdf")


@app.get("/api/doc/{sha}/title")
async def get_pdf_title(sha: str) -> Optional[str]:
    """
    Fetches a PDF's title.

    sha: str
        The sha of the pdf title to return.
    """
    pdf_info = os.path.join(configuration.output_directory, "pdf_metadata.json")

    with open(pdf_info, "r") as f:
        info = json.load(f)

    data = info.get("sha", None)

    if data is None:
        return None

    return data.get("title", None)


@app.post("/api/doc/{sha}/comments")
def set_pdf_comments(
    sha: str, comments: str = Body(...), x_auth_request_email: str = Header(None)
):
    user = get_user_from_header(x_auth_request_email)
    status_path = os.path.join(configuration.output_directory, "status", f"{user}.json")
    exists = os.path.exists(status_path)

    if not exists:
        # Not an allocated user. Do nothing.
        return {}

    update_status_json(status_path, sha, {"comments": comments})
    return {}


@app.post("/api/doc/{sha}/junk")
def set_pdf_junk(
    sha: str, junk: bool = Body(...), x_auth_request_email: str = Header(None)
):
    user = get_user_from_header(x_auth_request_email)
    status_path = os.path.join(configuration.output_directory, "status", f"{user}.json")
    exists = os.path.exists(status_path)
    if not exists:
        # Not an allocated user. Do nothing.
        return {}

    update_status_json(status_path, sha, {"junk": junk})
    return {}


@app.post("/api/doc/{sha}/finished")
def set_pdf_finished(
    sha: str, finished: bool = Body(...), x_auth_request_email: str = Header(None)
):
    user = get_user_from_header(x_auth_request_email)
    status_path = os.path.join(configuration.output_directory, "status", f"{user}.json")
    exists = os.path.exists(status_path)
    if not exists:
        # Not an allocated user. Do nothing.
        return {}

    update_status_json(status_path, sha, {"finished": finished})
    return {}


@app.get("/api/doc/{sha}/annotations")
def get_annotations(
    sha: str, x_auth_request_email: str = Header(None)
) -> PdfAnnotation:
    user = get_user_from_header(x_auth_request_email)
    annotations = os.path.join(
        configuration.output_directory, sha, f"{user}_annotations.json"
    )
    exists = os.path.exists(annotations)

    if exists:
        with open(annotations) as f:
            blob = json.load(f)

        return blob

    else:
        return {"annotations": [], "relations": []}


@app.post("/api/doc/{sha}/annotations")
def save_annotations(
    sha: str,
    annotations: List[Annotation],
    relations: List[RelationGroup],
    x_auth_request_email: str = Header(None),
):
    """
    sha: str
        PDF sha to save annotations for.
    annotations: List[Annotation]
        A json blob of the annotations to save.
    relations: List[RelationGroup]
        A json blob of the relations between the annotations to save.
    x_auth_request_email: str
        This is a header sent with the requests which specifies the user login.
        For local development, this will be None, because the authentication
        is controlled by the Skiff Kubernetes cluster.
    """
    # Update the annotations in the annotation json file.
    user = get_user_from_header(x_auth_request_email)
    annotations_path = os.path.join(
        configuration.output_directory, sha, f"{user}_annotations.json"
    )
    json_annotations = [jsonable_encoder(a) for a in annotations]
    json_relations = [jsonable_encoder(r) for r in relations]

    # Update the annotation counts in the status file.
    status_path = os.path.join(configuration.output_directory, "status", f"{user}.json")
    exists = os.path.exists(status_path)
    if not exists:
        # Not an allocated user. Do nothing.
        return {}

    with open(annotations_path, "w+") as f:
        json.dump({"annotations": json_annotations, "relations": json_relations}, f)

    update_status_json(
        status_path, sha, {"annotations": len(annotations), "relations": len(relations)}
    )

    return {}


@app.get("/api/doc/{sha}/tokens")
def get_tokens(sha: str):
    """
    sha: str
        PDF sha to retrieve tokens for.
    """
    pdf_tokens = os.path.join(configuration.output_directory, sha, "pdf_structure.json")
    if not os.path.exists(pdf_tokens):
        raise HTTPException(status_code=404, detail="No tokens for pdf.")
    with open(pdf_tokens, "r") as f:
        response = json.load(f)

    return response

@app.post("/api/annotation/classes")
def get_classes(ontoNames: List[str]) -> List[OntoClass]:
    """
    Get the labels used for annotation for this app.
    """
    resultClasses = list()
    for filename in ontoNames:
        classes_properties = getClassesAndPropertiesFromJsonOntology(filename)
        
        resultClasses.extend(classes_properties['classes'])

    return resultClasses


@app.post("/api/annotation/properties")
def get_properties(ontoNames: List[str]) -> List[OntoProperty]:
    """
    Get the relations used for annotation for this app.
    """
    resultProperties = list()
    for filename in ontoNames:
        classes_properties = getClassesAndPropertiesFromJsonOntology(filename)
        
        resultProperties.extend(classes_properties['properties'])

    return resultProperties

@app.get("/api/annotation/allocation/info")
def get_allocation_info(x_auth_request_email: str = Header(None)) -> Allocation:

    # In development, the app isn't passed the x_auth_request_email header,
    # meaning this would always fail. Instead, to smooth local development,
    # we always return all pdfs, essentially short-circuiting the allocation
    # mechanism.
    user = get_user_from_header(x_auth_request_email)

    status_dir = os.path.join(configuration.output_directory, "status")
    status_path = os.path.join(status_dir, f"{user}.json")
    exists = os.path.exists(status_path)

    if not exists:
        # If the user doesn't have allocated papers, they can see all the
        # pdfs but they can't save anything.
        papers = [PaperStatus.empty(sha, sha) for sha in all_pdf_shas()]
        response = Allocation(
            papers=papers,
            hasAllocatedPapers=False
        )

    else:
        with open(status_path) as f:
            status_json = json.load(f)

        papers = []
        for sha, status in status_json.items():
            papers.append(PaperStatus(**status))

        response = Allocation(papers=papers, hasAllocatedPapers=True)

    return response

@app.post("/api/upload/ontology")
def uploadOntology(file: UploadFile = File(...)) -> OntologyData:
    # l'argomento passato deve avere lo stesso nome che devinisco con
    # formData.append('nomeArgomento', fileObj, fileObj.name); 
    # Altrimenti errore: '422 unprocessable entity fastapi'
 
    file_location = os.path.join(configuration.upload_ontology_directory, f"{file.filename}")

    with open(file_location, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = analyze_ontology(os.path.abspath(file_location))
    saveOntologyDataToJson({"name": file.filename, "data": result}, file.filename) 

    return result

def copy(source: Union[str, Path], destination: Union[str, Path]) -> None:
    shutil.copy(str(source), str(destination))

@app.post("/api/upload/doc")
def uploadDocument(x_auth_request_email: str = Header(None), file: UploadFile = File(...)):
    """
    Add a PDF to the pawls dataset (skiff_files/).
    """
    user = get_user_from_header(x_auth_request_email)

    pdf = str(file.filename)

    pdf_name = Path(pdf).stem

    output_dir = os.path.join(configuration.output_directory, pdf_name)

    os.umask(0)
    os.mkdir(output_dir, 0o777)
    abspath_output_dir = os.path.abspath(output_dir)
    file_location = os.path.join(abspath_output_dir, f"{file.filename}")

    with open(file_location, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    npages = preprocess("pdfplumber", file_location)

    
    assign(configuration.output_directory, user, pdf_name, npages, file_location)
    return "ok"

@app.delete("/api/ontology/{filename}") 
def deleteOntology(filename: str):
    def removeOntology():
        file_location = os.path.join(configuration.upload_ontology_directory, f"{filename}")
        path = os.path.abspath(file_location)
        
        os.remove(path)
    
    def removeDataJsonOntology(): 
        file_location = os.path.join(configuration.extracted_data_from_ontology_directory, f"{filename}.json")
        path = os.path.abspath(file_location)
        
        os.remove(path)

    removeOntology()
    removeDataJsonOntology()
    return "Files removed..."

@app.get("/api/ontology/names")
def getNamesOntologiesAlreadyUploaded():
    namesOfOnto = list()

    for file in os.listdir(configuration.extracted_data_from_ontology_directory):
        if file.endswith('.json'):
            result = file.split('.json')[0]
            namesOfOnto.append(result)

    return {"ontologiesNames": namesOfOnto}

@app.get("/api/annotation/{sha}/export")
def export_annotations(sha: str, x_auth_request_email: str = Header(None)):
    user = get_user_from_header(x_auth_request_email)
    annotations = os.path.join(
        configuration.output_directory, sha, f"{user}_annotations.json"
    )
    exists = os.path.exists(annotations)

    path_pdfs_satus = os.path.join(configuration.output_directory, "status", f"{user}.json")

    with open(path_pdfs_satus, "r") as f:
        pdfs_satus = json.load(f)

    total_pages = pdfs_satus[sha]["totalPages"]
    path_document = pdfs_satus[sha]["path"]
    abspath_document = os.path.abspath(path_document)

    if not exists:
        raise HTTPException(status_code=404, detail=f"pdf {sha} not found.")

    abspath_annotations = os.path.abspath(annotations)
    path_export = os.path.join(
        configuration.directory_extracted_annotations, f"{sha}_extractedAnnotations"
    )
    abspath_export = os.path.abspath(path_export)

    # export the annotations end get path where the file generated has been saved
    abspath_export_result = export.export_annotations(
        abspath_annotations,
        abspath_export,
        sha,
        abspath_document,
        total_pages
    )
    filename_export_result = abspath_export_result.split("/")[-1]

    # per export di nt:
    #return FileResponse(abspath_export_result, headers={"Access-Control-Expose-Headers":"Content-Disposition"}, media_type="application/n-triples", filename=filename_export_result)
    # per export di ttl:
    return FileResponse(abspath_export_result, headers={"Access-Control-Expose-Headers":"Content-Disposition"}, media_type="text/turtle", filename=filename_export_result)