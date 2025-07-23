---
name: Admin Team Request
description: Request to add or remove a user from the admin team.
title: "[ADMIN] Admin team modification request"
labels: ["admin-request"]
assignees: [@renan-org/admin-group]

body:
  - type: input
    id: namespace_path
    attributes:
      label: GitHub Handle
      description: "Enter the GitHub username (without @)"
      placeholder: "e.g., username"
    validations:
      required: true

  - type: dropdown
    id: action
    attributes:
      label: Modification Type
      description: "Select the type of modification"
      options:
        - add
        - remove
      default: add
    validations:
      required: true

  - type: textarea
    id: justification
    attributes:
      label: Justification
      description: "Provide a brief justification for this request"
      placeholder: "Please explain why this admin access change is needed..."
    validations:
      required: true
