#!/bin/bash

echo -e "\033[0;32mDeploying updates to GitHub...\033[0m"

# checkout master
cd public && git checkout master && cd ../

# Build the project.
# hugo -t <theme> when using themes
hugo -t emperor

# Add changes to git
cd public && git add .

# Commit changes.
msg="rebuilding site `date`"
if [ $# -eq 1  ]
    then msg="$1"
fi
git commit -m "$msg"

# Push source and build repos.
git push origin master

# Come Back up to the Project Root
cd ..

git add .
git commit -m "$msg"
git push origin master
