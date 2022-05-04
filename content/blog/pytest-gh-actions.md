---
title: "Setting up pytest with GitHub Actions"
date: 2022-05-04T23:00:46+03:00
categories: [github, pytest, ci/cd]
tags: []
draft: false
include_toc: true
description: "Making GitHub do the dirty work"
---

For the longest time I have been ignoring GitHub Actions despite all the good things said about them. I’ve been a long-time user of CircleCI [[1]](https://circleci.com/) - it is a solid CI/CD platform, and it is perfectly sufficient for my (minimal) needs. However, a few days ago I decided to give GitHub Actions a shot - having CI/CD steps defined on the same platform where the code resides seemed appealing.

As an initial test, I set up a simple `pytest` flow for a Django (Python) project. I was expecting to struggle a bit with setting it up the first time, but it turned out to be a straightforward process. However, I did have to google a bit to arrive at the setup that I wanted. Thus, I decided to share a short instruction set on how to do it to have something to refer back to in the future. And who knows - perhaps some weary wanderer on the Internet will find it useful, too.

## Setting Up Pytest GitHub Action

1. Go to your project on GitHub
2. Click on "Actions" tab
3. Select or search for “Python Application”
4. Click “Configure”.
5. You’ll get the default config that has three steps: setup Python, install dependencies, and lint with `flake8`
6. Change the file name to `pytest` (or any other descriptive name)
7. Change

```yaml
jobs:
  build:
```

to

```yaml
jobs:
  test:
```

8. Remove unnecessary commands and dependencies, such as `flake8` or `if [ -f requirements.txt ]` condition
9. Add cache [[2]](https://github.com/actions/cache)[[3]](https://github.com/actions/cache/blob/main/examples.md#python---pip) right after setting up Python, but before dependency installation:

```yaml
- uses: actions/cache@v3
  id: cache
  with:
    path: ~/.cache/pip
    key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.*') }}
    restore-keys: | 
      ${{ runner.os }}-pip-
```

This will cache the downloaded assets (tarballs, wheels, etc). Thus, `pip` will skip re-downloading them on every action if it finds them present in the cache. Note that it will still install dependencies rather than retrieve them from cache, because this setup will not cache the installed packages (which is possible [[4]](https://stackoverflow.com/questions/68372063/github-action-pip-dependencies-not-working-after-found-cache/)).

10. Finally, add `pytest` step:

```yaml
- name: Run pytest
  run: | 
    pytest
```

11. Click “Start commit” and commit the changes - action will start running automatically

## Final Configuration

The final output should be similar to the following:

```yaml
name: pytest

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

permissions:
  contents: read

jobs:
  test:

    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    - name: Set up Python 3.10
      uses: actions/setup-python@v3
      with:
        python-version: "3.10"
    - uses: actions/cache@v3
      id: cache
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.*') }}
        restore-keys: | 
          ${{ runner.os }}-pip-
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    - name: Run pytest
      run: | 
        pytest
```

With this setup GitHub will run pytest on every push to the `main` branch, as well as on any pull request that wishes to merge changes into the `main` branch. It will also make sure to cache downloaded dependency-related assets.


## Sources

1. https://circleci.com/
2. https://github.com/actions/cache
3. https://github.com/actions/cache/blob/main/examples.md#python---pip
4. https://stackoverflow.com/questions/68896173/issue-caching-python-dependencies-in-github-actions
