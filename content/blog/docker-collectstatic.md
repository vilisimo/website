---
title: "File System Permissions in Dockerfile"
date: 2022-08-13T11:37:56+03:00
draft: false
categories: [docker, django, linux]
tags: []
description: "The dreaded '[Errno 13] Permission denied' error and how to fix it"
---

Few days ago I was playing with a Django application, trying to containerize it. Everything was going smoothly until I tried to run `collectstatic` in Dockerfile. Attempting to do so threw the following error:

```bash
Traceback (most recent call last):
  File "/home/project/app/manage.py", line 33, in <module>
    main()
  File "/home/project/app/manage.py", line 29, in main
    execute_from_command_line(sys.argv)
  File "/usr/local/lib/python3.10/site-packages/django/core/management/__init__.py", line 446, in execute_from_command_line
    utility.execute()
  File "/usr/local/lib/python3.10/site-packages/django/core/management/__init__.py", line 440, in execute
    self.fetch_command(subcommand).run_from_argv(self.argv)
  File "/usr/local/lib/python3.10/site-packages/django/core/management/base.py", line 402, in run_from_argv
    self.execute(*args, **cmd_options)
  File "/usr/local/lib/python3.10/site-packages/django/core/management/base.py", line 448, in execute
    output = self.handle(*args, **options)
  File "/usr/local/lib/python3.10/site-packages/django/contrib/staticfiles/management/commands/collectstatic.py", line 209, in handle
    collected = self.collect()
  File "/usr/local/lib/python3.10/site-packages/django/contrib/staticfiles/management/commands/collectstatic.py", line 135, in collect
    handler(path, prefixed_path, storage)
  File "/usr/local/lib/python3.10/site-packages/django/contrib/staticfiles/management/commands/collectstatic.py", line 378, in copy_file
    self.storage.save(prefixed_path, source_file)
  File "/usr/local/lib/python3.10/site-packages/django/core/files/storage.py", line 56, in save
    name = self._save(name, content)
  File "/usr/local/lib/python3.10/site-packages/django/core/files/storage.py", line 295, in _save
    os.makedirs(directory, exist_ok=True)
  File "/usr/local/lib/python3.10/os.py", line 215, in makedirs
    makedirs(head, exist_ok=exist_ok)
  File "/usr/local/lib/python3.10/os.py", line 225, in makedirs
    mkdir(name, mode)
PermissionError: [Errno 13] Permission denied: '/home/project/app/static/admin'
```

This took me a little bit to figure out, mostly because I missed a command in Dockerfile. I failed to reflect on the basics of Linux filesystem and how Docker works which made the bug hunt longer than it should have been. However, spending some time on experimentation made the mistake obvious and drove the lesson home.

# Project Structure

For the purposes of not missing the forest for the trees, this is the simplified project structure:

```bash
user@user:~/coding/project$ tree -a -L 1

├── Dockerfile
├── .dockerignore
├── env
├── .git
├── .gitignore
├── gunicorn.conf.py
├── manage.py
├── project
├── README.md
├── requirements.txt
└── settings
```

# Dockerfile

This is the simplified `Dockerfile`:

```dockerfile
FROM python:3.10.6-slim

RUN useradd -U app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get -y install libpq-dev gcc netcat

COPY requirements.txt ./
RUN pip install -U pip setuptools --no-cache-dir -r requirements.txt

ENV APP_DIR=app
ENV USER_HOME=/home/project
ENV CODE_DIR=$USER_HOME/$APP_DIR

WORKDIR $CODE_DIR
RUN mkdir $CODE_DIR/static

COPY --chown=app . $CODE_DIR

USER app

RUN python manage.py collectstatic --no-input
```

# The Issue and the Fix

An observant reader will note the issue immediately. However, for mere mortals like me, this is the relevant bit of the Dockerfile:

```dockerfile
RUN mkdir $CODE_DIR/static

COPY --chown=app . $CODE_DIR

USER app

RUN python manage.py collectstatic --no-input
```

What is happening here? Well, first of all, we create a `static/` directory, which matches the static directory specified in the `settings.py` file. This is where we intend the static assets to live. However, note that we have this command before specifying that we wish to switch to `app` user (`USER app`). Thus, the command runs as `root`. Therefore, it is owned by `root`, and the `app` user has no permissions to write to it. The simple fix is to edit the line to read as follows:

```dockerfile
RUN mkdir $CODE_DIR/static && chown app $CODE_DIR/static
```

Now, `static/` folder belongs to `app`, and `app` can create additional folders and files inside of it.

# Further Exploration

One might wonder if we perhaps could simply not create the folder and let `collectstatic` do it - after all, we are running it as `app`, so it would make sense that whatever we run after switching to `app` user should belong to `app`. While this may indeed be true (provided we have a Dockerfile as defined above) it would still not solve the issue. To understand why we can exec inside the container and view the permissions of the file system:

```bash
app@e6bde753d120:~/app$ ls -la

drwxr-xr-x 1 root      root      4096 Aug 13 09:04 .
drwxr-xr-x 1 root      root      4096 Aug 13 09:04 ..
-rw-rw-r-- 1 app app  219 Aug 12 04:55 README.md
-rw-rw-r-- 1 app app  502 Aug 12 04:55 docker-compose.yaml
-rw-rw-r-- 1 app app   53 Aug 12 04:55 gunicorn.conf.py
-rwxrwxr-x 1 app app  929 Aug 12 04:55 manage.py
drwxrwxr-x 7 app app 4096 Jul 30 09:15 project
-rw-rw-r-- 1 app app  111 Aug 12 04:55 requirements.txt
drwxrwxr-x 3 app app 4096 Aug 12 04:55 settings
```

Note the following line:

```bash
drwxr-xr-x 1 root      root      4096 Aug 13 09:04 .
```

This means that the current directory is owned by a `root` user. Hence, `app` user has no power in there, including trying to create directories (which `collectstatic` would attempt to do). To verify that this is the case, let's break down `drwxr-xr-x 1 root root 4096 Aug 13 09:04 .`:

- `d` - directory
- `rwx` - permissions the owner has over the directory (read, write, execute)
- `r-x` - permissions the group has over the directory (read, execute)
- `r-x` - _permissions others have over the directory (read, execute)_
- `1` - number of hard links to the directory
- `root` - user that owns the directory
- `root` - the group that the directory belongs to
- `4096` - size in bytes of the directory
- `Aug 13 09:04` - date of last modification

As we can see, only the owner of the directory (`root`) has write permissions necessary to create files and folders - all others can either read or execute them, but not write new ones. We can double check that:

```bash
app@e6bde753d120:~/app$ touch test
touch: cannot touch 'test': Permission denied
```

As expected, `app` doesn't have permissions to create the file. This is good for security purposes - we don't want rogue processes creating and/or modifying random files - but it also means that we need to be deliberate about what the user can and can't do, which folders it should own, and which folders/files we should create manually.

# Alternative Solution

After short exploration of the permissions, we can naturally ask ourselves if we could make the `app` own `/app` folder. The answer is yes:

```dockerfile
RUN mkdir -p $CODE_DIR && chown app $CODE_DIR
WORKDIR $CODE_DIR
```

This will create a directory for the app and change its owner to `app`. Then, running `ls -la` we get the following results:

```bash
app@0703f786ec8a:~/app$ ls -la

drwxr-xr-x 1 app root      4096 Aug 13 09:37 .
```

Now the `~/app` directory is owned by `app`, and it has all the permissions it needs. And indeed, if we run `collectstatic` we'll be able to create the necessary folders and files:

```bash
app@0703f786ec8a:~/app$ python manage.py collectstatic

You have requested to collect static files at the destination
location as specified in your settings:

    /home/project/app/static

This will overwrite existing files!
Are you sure you want to do this?

Type 'yes' to continue, or 'no' to cancel: yes

0 static files copied to '/home/project/app/static', 163 unmodified.
```

# Conclusion

Despite Docker abstracting away a lot of complexity of creating the images, we still need to understand the building blocks on which it operates. And even if we do understand it, we need to be careful to not overlook small but important details in our Dockerfiles. On the flip side, the best way to learn these things is to fail and spend time figuring out why.