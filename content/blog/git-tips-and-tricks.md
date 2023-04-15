---
title: "Git Tips And Tricks"
date: 2023-04-12T20:47:55+03:00
draft: true
include_toc: true
categories: [git]
tags: []
description: "Git is ubiquitous, but the ways of how people use it are not. Care to compare the toolsets?"
---

These days, `git` is more or less synonymous with version control system. It does not matter what programming language you use, chances are you’ll use `git` to keep track of the code. Thus, one of the best ways to improve your development confidence and velocity is to get to know `git` well. While it is not necessary to understand all the minute details to be a proficient user, having a few neat tricks up your sleeve certainly helps. Below I’ve documented a few that I use all the time.

## Diff the Changes
If you are creating pull requests (PR) for other people to review, chances are you want to show your best work to them. To do so, I find it useful to go through the changes myself once more before creating a PR for someone to look at. For me, some issues pop out much more visibly when I look at the code outside of code editor. Thus, before pushing a branch to remote and creating a PR I always run the following commands:

```shell
git diff <branch> # if I want to compare all the changes to <branch>
git diff <branch> <path-to-file> # if I’m interested in a specific file
```

Note that `<branch>` here doesn’t have to be `main` or `master`. It can be any branch you wish to compare your branch/file against.

## Rewrite (Very Recent) History
When working on a big set of changes, I like to split the work into several self-contained commits. However, this split is not always trivial to figure out from the get go. With `git`, I don't need to stress about it. Instead, I mold the history into coherent commits later, when the picture is clearer. However, to do that, one has to be able to edit commits.

There are several ways to do it. The easiest one is to run:

```shell
git commit --amend
```

This command will let you change the message of the last commit. 

On the other hand, if you feel that the commit message is just fine but the content of it needs a few more changes, you can do that, too. Simply stage the files (or changes) that you wish to include in the last commit, and issue the following command:

```shell
git commit --amend --no-edit
```

I use this all the time. In fact, I use it so often that I even have an alias for it (discussed later).

## Rewrite (Any) History
The previous couple of commands are useful for editing the last commit. If the commit is older, I reach for:

```shell
git rebase -i HEAD~{n}
```

where `{n}` is the number of commits to include in the rebase. In the window that pops up replace `pick` with `r` or `reword`, and you’ll be able to rewrite commit messages. I would recommend exploring other options, too. I regularly use all of them, and it’s well worth your time to get comfortable with them.

## Rename The Branch
Sometimes, the first attempt to find a fitting name for a branch leaves a lot to be desired. However, never fret - `git` has our back. Fixing the mistake is as easy as:

```shell
git checkout <branch-name>
git branch -m <new-branch-name>
```

Of course, you do not need to check out the branch to be able to rename it:

```shell
git branch -m <old-branch-name> <new-branch-name>
```

## Navigating Between Two Branches With Ease
Have you ever been in a situation where you had to switch from the main branch to another back and forth? Are you tired of typing 

```shell
git checkout shiny-changes
git checkout master 
git checkout shiny-changes
git checkout master 
…
```

all the time? Well, turns out you don’t have to.

```shell
git checkout -
```

switches to the previous branch. In fact, you can be even more fancy and jump a few branches back. For example:

```shell
git checkout master # switches to master
git checkout first-branch # switches to first-branch
git checkout second-branch # switches to second branch
git checkout master # back to master
git checkout @{-2} # back to first-branch
```

According to [`git` documentation](https://git-scm.com/docs/git-checkout), `@{-N}` can be used as follows:

> You can use the @{-N} syntax to refer to the N-th last branch/commit switched to using "git switch" or "git checkout" operation. You may also specify - which is synonymous to @{-1}. This is often used to switch quickly between two branches, or to undo a branch switch by mistake.

While I personally do not find myself reaching for `@{-N}` in my daily flow (other than the `-` shortcut for `@{-1}`), it might come in handy in some cases.

## Switching to Switch
`git checkout` has been with us for ages. You can create branches, switch between them, restore files to a certain version, and perform a bunch of other essential operations with it. The problem is that even hardened `git` veterans sometimes get confused about what exactly `git checkout` is capable of. To remedy this, the [2.23.0](https://github.com/git/git/blob/master/Documentation/RelNotes/2.23.0.txt) version introduced a couple of new commands that are designed to split `git checkout` functionality. These commands are `git switch` and `git restore`. The former can be used to change branches, while the latter can be used for resetting the files to certain revisions. Therefore, instead of:

```shell
git checkout main
```

You can do:

```shell
git switch main
```

There are [many](https://git-scm.com/docs/git-restore) [more](https://git-scm.com/docs/git-switch) operations that can be performed with these two commands - if you're comfortable with `git checkout`, you’ll find them to be familiar.

On a personal note, I still use `git checkout` for most of the functionality that `git switch` and `git restore` could be used for. However, that’s simply because I am used to it. Conceptually, the new commands seem clearer and more specialized.

## Get (Brief) History of Commits
Sometimes you want to check the previous commits. However, `git log` is too verbose - you don’t care about the author, date, or any of that noise. To avoid it, you can ask for a condensed history, like so:

```shell
git log --oneline
```

By the way, one can limit the lines this command outputs by appending `-{n}` to the command:

```shell
git log --oneline -{n}
```

Where `n` is the amount of lines you wish the command to output.

## Grep the Log
Sometimes you work in an environment [where commits are made up and commit messages do not matter](https://www.youtube.com/watch?v=9KAGwNtI26w&pp=ygUjcG9pbnRzIGFyZSBtYWRlIHVwIGFuZCBkb24ndCBtYXR0ZXI%3D). Other times, however, commit messages are actually useful and it pays off to read through them. In such times, you might wish to search for a specific commit by its message:

```shell
git log --all --grep='<commit msg>'
```

As a nice side effect, this command motivates one to aim for descriptive and clear commit messages - a skill that is woefully rare.

## Grep the Content
For completeness, it is worth noting that you can grep not only commit messages, but commit content, too. While I do not use this command all that often, it sometimes does come in handy, especially when I am looking for vaguely familiar code that I know was removed. This is the incantation to perform said magic:

```shell
git grep <regexp> $(git rev-list --all)
```

A more thorough explanation can be found in [StackOverflow](https://stackoverflow.com/questions/2928584/how-to-grep-search-committed-code-in-the-git-history).

## Set Up Aliases
While knowing a bunch of `git` commands is useful, it’s hard to deny that many of them feel like arcane incantations to summon demons, or worse. The commands are not particularly intuitive or concise, and they tend to slip out of the mind the minute you turn away from your terminal. Thankfully, `git` has a wonderful functionality to set up custom aliases. With the help of these, you can turn demonic rituals such as these:

```shell
git log --graph --date-order --date=short --pretty=format:'%C(auto)%h%d %C(reset)%s :: %C(bold blue)%ce %C(reset)%C(green)(%cr)'
```

Into something more readable:

```shell
git lg
```

There are two ways to create aliases. The first one (and the one I prefer) is to edit the `~/.gitconfig` file. Add the following lines:

```text
[alias]
    cm=commit -m
```

And you’ll be able to use `git cm “commit message”` instead of typing in `git commit -m “commit message”`.

The second way is to set it up via git config:

```shell
git config --global alias.cm ‘commit -m’
```

Note that you should use single quotes (`’`) on Unix or double quotes (`”`) on Windows if the alias has a space (like in the example above).

I use a bunch of `git` aliases every day. I don’t have anything particularly complicated set up, but I find that even aliases for relatively short and simple commands save a lot of time. At the moment, these are my most used ones:

```text
ca = commit --amend
cm = commit -m
ds = diff --staged
ol = log --oneline
rb = branch -m
cane = commit --amend --no-edit
alias = ! git config -l | grep alias | cut -c 7-
cleanup = fetch --all --prune
```

Feel free to steal them, edit them and make your workflow easier. You can also take a look at a full list of aliases that I use [here](https://github.com/vilisimo/setup/blob/master/git/gitconfig).