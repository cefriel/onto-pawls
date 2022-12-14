from typing import NamedTuple, List, Dict
import json


class Configuration(NamedTuple):
    """
    General configuration for the annotation tool.
    upload_ontology_directory: str, required.
        The directory where will be stored the 
        ontologies uploaded
    extracted_data_from_ontology_directory: str, required.
        The directory where will be stored the json file containing
        data extracted from the ontologies uploaded
    output_directory: str, required.
        The directory where the pdfs and
        annotation output will be stored.
    labels: List[Dict[str, str]], required.
        The labels in use for annotation.
    relations: List[Dict[str, str]], required.
        The relations in use for annotation.
    users_file: Name str, required
        Filename where list of allowed users is specified.
    """
    upload_ontology_directory: str
    directory_extracted_annotations: str
    extracted_data_from_ontology_directory: str
    output_directory: str
    labels: List[Dict[str, str]]
    relations: List[Dict[str, str]]
    users_file: str


def load_configuration(filepath: str) -> Configuration:
    try:
        blob = json.load(open(filepath))
        return Configuration(**blob)
    except TypeError as e:
        print(
            "Error loading configuration file %s, maybe you're missing a required field? Exception string: %s"
            % (filepath, e)
        )
        raise e
    except Exception as e:
        print("Error loading configuration file %s" % filepath)
        raise e
