from tkinter.tix import Form
from typing import List, Optional, Dict, Any
import logging
import os
import json
import glob
from urllib import request
import shutil

from owlready2 import *

from fastapi import FastAPI, HTTPException, Header, Response, Body, Form, File, UploadFile, Query
from fastapi.responses import FileResponse
from fastapi.encoders import jsonable_encoder

from app.metadata import PaperStatus, Allocation
from app.annotations import Annotation, RelationGroup, PdfAnnotation
from app.utils import StackdriverJsonFormatter
from app import pre_serve
from app.ontologies import *

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
    #label = entity.label.first() #soltanto con p_pan le prop. vengono del tipo C:\Users\...\ontologie\p_plan.correspondsToStep
    #label = entity.name
    #con entrambe le istruzioni precedenti perdo l'informazione: onto.Nome
    """
    if label == None:
        return entity
    return label
    """
    return str(entity)

def analyze_ontology(path: str) -> OntologyData:  #"file://C:\\Users\\youss\\progettoTesi\\owlready2\\ontologie\\p_plan.owl"

    classes_result = set() 
    properties_result = set()

    onto = os.path.join("file://", f"{path}")
    onto = get_ontology(onto).load() 

    print("path of onto: ", onto)

    def getClasses():
        for entity in onto.classes():
            print("->Class: ", entity)
            rendered = renderLabelsOfOntology(entity)
            print(rendered)
            classes_result.add(rendered)
    def getProperties():
        for data_property in list(onto.data_properties()):
            print("->Property: ", data_property)
            rendered = renderLabelsOfOntology(data_property)

            print(rendered)

            properties_result.add(rendered)

        for object_properties in list(onto.object_properties()):
            print("->Property: ", object_properties)
            rendered = renderLabelsOfOntology(object_properties)

            print(rendered)

            properties_result.add(rendered)
    getClasses()
    getProperties()
    print("Classes:", classes_result, "\nProperties:", properties_result)
    return {"classes": sorted(list(classes_result)), "properties": sorted(list(properties_result))}
    #return OntologyData(classes=sorted(list(classes_result)), properties=sorted(list(properties_result)))

def saveOntologyDataToJson(ontology: Ontology, name: str):
    path = os.path.join(EXTRACTED_DATA_FROM_ONTO_FOLDER, f"{name}.json")
    with open(path, "w+") as f:
        #json.dump({"name": json_annotations, "data": json_relations}, f)
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


@app.get("/api/annotation/labels")
def get_labels() -> List[Dict[str, str]]:
    """
    Get the labels used for annotation for this app.
    """
    return configuration.labels


@app.get("/api/annotation/relations")
def get_relations() -> List[Dict[str, str]]:
    """
    Get the relations used for annotation for this app.
    """
    return configuration.relations


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

##### aggiunte per import ontologie
UPLOAD_FOLDER = 'onto/' #definire in file configurations
EXTRACTED_DATA_FROM_ONTO_FOLDER = 'onto/extractedData'
@app.post("/api/upload")
def uploadOntology(file: UploadFile = File(...)) -> OntologyData:
    # l'argomento passato deve avere lo stesso nome che devinisco con
    # formData.append('nomeArgomento', fileObj, fileObj.name); 
    # Altrimenti errore: '422 unprocessable entity fastapi'
    
    print("file name: ", file.filename)
    #file_location = f"{UPLOAD_FOLDER+file.filename}"
    file_location = os.path.join(UPLOAD_FOLDER, f"{file.filename}")

    with open(file_location, "wb+") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = analyze_ontology(os.path.abspath(file_location))
    saveOntologyDataToJson({"name": file.filename, "data": result}, file.filename) 
        #forse meglio prendere il nome dall'onto
    print("#######Result",result)

    return result

    #return {"info": f"file '{file.filename}' saved at '{file_location}'"}

@app.delete("/api/upload/{filename}") 
def deleteOntology(filename: str):
    print("file name of Ontology to delete: ", filename)
    def removeOntology():
        file_location = os.path.join(UPLOAD_FOLDER, f"{filename}")
        path = os.path.abspath(file_location)
        print("Path of file to remove:", path)
        os.remove(path)
    
    def removeDataJsonOntology(): 
        file_location = os.path.join(EXTRACTED_DATA_FROM_ONTO_FOLDER, f"{filename}.json")
        path = os.path.abspath(file_location)
        print("Path of file to remove:", path)
        os.remove(path)

    removeOntology()
    removeDataJsonOntology()
    return "Files removed..."

@app.post("/api/upload/ontologies")
def uploadOntology(ontologiesName: List[str]) -> List[Ontology]: #cambiare nome metodo 
    
    print("Names received: ", ontologiesName)
    
    ontologyList = []
    for ontologyName in ontologiesName:
        print("->Ontology name: ", ontologyName)
        dataOfOnto = getCLassesAndPropertiesFromJsonOntology(ontologyName)
        print("Classi estratte: ", dataOfOnto['classes'])
        print("Properties estratte: ", dataOfOnto['properties'])

        ontologyList.append({"name": ontologyName, "data": dataOfOnto})
    #Devo restituire i dati (classi e properties) di tutte le ontologie
    #Il front end li utilizzerà per mostrarle all'utente e permettergli di selezionare quella di 
    #cui ha bisogno per annotare il documento

    #Per ogni nome di ontologia ricevuta, concatena le classi e le properties da ogni nomeOnto.json
    #Oppure provare a restituire una lista di oggetti di Ontology
    return ontologyList

@app.post("/api/upload/ontologies")
def getCLassesAndPropertiesFromJsonOntology(filename: str) -> OntologyData:
    file_location = os.path.join(EXTRACTED_DATA_FROM_ONTO_FOLDER, f"{filename}.json")
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
    print("classesResult:", classesResult)
    #response = OntologyData(classes=classesResult, properties=propertiesResult) 
    #pydantic.error_wrappers.ValidationError: 
    return {"classes": classesResult, "properties": propertiesResult}

@app.get("/api/ontology/names")
def getNamesOntologiesAlreadyUploaded():
    namesOfOnto = list()

    for file in os.listdir(EXTRACTED_DATA_FROM_ONTO_FOLDER):
        if file.endswith('.json'):
            result = file.split('.json')[0]
            namesOfOnto.append(result)
            
    print('---->Onto already uploaded: ', namesOfOnto)
    #return {"ontologiesNames": ["x.nt", "y.xml"]}
    return {"ontologiesNames": namesOfOnto}