import os
from typing import Tuple

import json
import glob
import re

def assign(
    path: str,
    annotator: str,
    sha: str,
    npages: int,
    file_location: str,
):
    """
    Assign pdfs and annotators for a project.

    Use assign to assign annotators to a project, or assign them
    pdfs in the specified directory.

    Annotators must be assigned a username corresponding
    to a gmail email address, such as `markn@gmail.com`.

    Add an annotator:

        `pawls assign <path to pawls directory> markn@gmail.com`

    To assign all current pdfs in the project to an annotator, use:

        `pawls assign <path to pawls directory> <annotator> --all`
    """

    pdfs = glob.glob(os.path.join(path, "*/*.pdf"))
    project_shas = {p.split("/")[-2] for p in pdfs}

    """ 
    diff = shas.difference(project_shas)
    if diff:
        error = f"Found shas which are not present in path {path} .\n"
        error = (
            error
            + f"Add pdf files in the specified directory, one per sub-directory."
        )
        for sha in diff:
            error = error + f"{sha}\n"
        print(error) # todo bisogna uscire 
    """

    result = re.match(r"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)", annotator)

    if not result or result.group(0) != annotator:
        print("Provided annotator was not a valid email.") 
        # todo bisogna uscire

    status_dir = os.path.join(path, "status")
    os.makedirs(status_dir, exist_ok=True)

    status_path = os.path.join(status_dir, f"{annotator}.json")

    pdf_status = {}
    if os.path.exists(status_path):
        pdf_status = json.load(open(status_path))

    name = sha

    pdf_status[sha] = {
        "sha": sha,
        "name": name,
        "path": file_location,
        "totalPages": npages,
        "annotations": 0,
        "relations": 0,
        "finished": False,
        "junk": False,
        "comments": "",
        "completedAt": None,
    }

    with open(status_path, "w+") as out:
        json.dump(pdf_status, out)
