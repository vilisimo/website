---
title: "Making History"
date: 2018-06-11T23:43:08+03:00
draft: false
categories: [git]
tags: []
description: "Git gives us a way to travel back in time. We have a responsibility to make these trips as smooth as possible."
---

## History
> History will be kind to me for I intend to write it. - Winston Churchill (not really)

As in real life, history in software development is important for several reasons. The first one is to have someone to blame when things go wrong. Once we've done that, it is also useful for figuring out how development has evolved, what changes were introduced, when they were introduced, and what was the reason for them. To achieve it, the first tool to reach for is `git log`. Then, `git diff commit_hash^ commit_hash` can usually solidify our understanding by showing what new stuff was introduced for that shiny new feature and/or what might have gone wrong.

Real life is messy, though. As in world history, `git log` is usually chaotic. Just because it's written down doesn't mean it makes much sense. It doesn't even mean that it is related to the changes at all. Quite often you stare at the git history, and the history stares back at you with a mischevious glint in its eye.

This will not do.

## Atomic Commits
> ***atomic*** - forming a single irreducible unit or component in a larger system.

One of the best ways to avoid the sloppy git history is to aim for **_atomic_** commits. Easy enough. But what the hell is atomic commit? 

Simply put, atomic commit consists _only_ of the changes that are absolutely necessary for what the commit is about - nothing more, nothing less. Taking anything away would break the functionality. Adding something would be unnecessary for the functionality. Therefore, if the commit message reads:

{{< highlight default >}}
0aed60f Use a separate .gitignore for each directory
{{< /highlight >}}

We better make damn sure that the `git diff 0aed60f^ 0aed60f` doesn't show anything that is not essential for adding .gitignore files to each of the directories. That includes formatting code, fixing grammar mistakes in documentation, adding comments. All those things are nice, but how are they related to .gitignore files?

What about this commit? Would it be okay to include some minor adjustments to the code, too, given that we're updating the file anyway?

{{< highlight default >}}
69d7fbf Update API documentation on /books endpoint
{{< /highlight >}}

Absolutely not. The description says we're updating documentation, so we should stick to documentation. Anything else is _irrelevant_ for the purpose of this commit. Even if the changes are the pinnacle of our genius, if they are put in the same commit they create history _noise_, which is _a very bad_ thing. Onlookers will not marvel at our considerable coding skills. Instead, they will point fingers and laugh at us for not knowing any better. Unacceptable. 

Instead, we should make the history read like so:

{{< highlight default >}}
dfdd05b Improve performance by 306%
69d7fbf Update API documentation on /books endpoint
{{< /highlight >}}

Now that's what I'm talking about. I'd trip over my own feet rushing to `git diff` that `dfdd05b`. Sweet baby Jesus. 306% in one commit. And to think it was hidden in a commit about documntation!

### I'm Still Confused Why Bloated Commits Are Bad
Atomic commits are all fine and dandy. However, why would we ever bother with them? Sure enough it's nice to have a clean history, but what of it? Git gives us all the tools to see the changes, why would we create more work for ourselves?

Well, for a start, a clean history means that we can easily see the progression of our code. We can see what changes each commit introduced, and we can judge what went woefully wrong (or wonderfully right). We can understand the aim of a commit at a glance, saving ourselves from having to wade through dozens (even hundreds) of lines of unrelated changes.

Think of it like this. Imagine you want to know all about French Revolution in 1789-1799. You pick up a book titled "French Revolution", and start leafing through it. It definitely has the information you need. The only problem is that it also discusses at length America's first presidential election (1789), assassination attempt of King Gustav III King of Sweden (1792), and Kosciusko's uprising in Poland (1794). These topics make up half of the book, and the discussion alternates between them without warning. Aside from the fact that it would be supremely confusing, it would also take much longer than necessary to learn important bits about the Revolution because of all the other topics that get in the way. Bloated commit history is like that.

There is also a second, equally serious drawback. Massive commits are much harder to work with. If we have small, atomic commits touching on very specific parts of the code, it is easy to remove or revert them, change their order, cherry pick them. However, if the commit touches half of the code base, this is going to be very painful, and time consuming. And eventually we _will_ have to manipulate commits. 

Finally, with a massive commit it takes so much longer than necessary to make sure that manipulating the commit will not break any of the existing functionality. Not to mention scarier. We will need to double and triple check that everything works. And playing with existing commits will happen, especially as our mastery of git grows.

On the other hand, keeping commits atomic makes it easy to:

- Merge commits
- Rebase commits
- Revert commits
- Reorganize commits
- Cherry pick commits
- Understand what went wrong
- Understand what went right

The list goes on and on...

### So the Commits Should Be as Small as Possible?
Not necessarily. Just because bloated commits are bad, it does not mean that commits touching one line only are necessarily good. Sure, we want to make our commits small and easily digestible. That does not mean, however, that every little change should go to a separate commit. Instead, it is best to aim for a commit that makes sense, that tells a story. If you are making a bugfix, it makes sense that the commit includes both the bugfix _and_ the tests verifying that it really does work.

To put it more succinctly, the overall aim of the commit should be to introduce a complete, stand-alone change. Checking out a project at any commit should give us a working, clean codebase with an easy to read and understand history.

That does not mean that every commit in our _local_ history should represent a working, clean state. Quite the opposite. Since git is decentralized, it gives us freedom to experiment and commit whenever we want and whatever we want. However, local history is just that - local. It is for our consumption, it is not intended for the wider audience. Once we feel the progress is ready to be published, we have a responsibility to make our history clean and easy to work with.

### But Making Atomic Commits Is Hard!
Indeed. Making atomic commits is arduous. Poeple's attention is fickle, and it is not uncommon to jump between the tasks. At any point in time there might be multiple files being edited and multiple changes juggled at the same time. It's safe to say that not all of them will be directly related to one another, or even to the same functionality.

Besides, unless you possess a perfect memory and insight, you will forget something, and you will need to come back and edit the code that was already committed. On that final review before opening a PR you will find grammar mistakes, strange wording, misleading method names.

This sounds like a situation ripe for gigantic and/or widely dispersed commits. But it does not have to be. One of the many gifts git bestows upon us is _local_ history, which does not need to be shared with others until you decide to do so. Our local history can be as messy, as dispersed and as bloated as we like. Other people do not need to know that. What we do on our own time on our own machine is none of their business. 

On the other hand, it becomes their business when we push the code to master or any other place where people are actively working. There we should aim to appear as an omnipotent being, always knowing what changes need to be made and when, and making exactly those changes - nothing more or less.

So how can we make our history atomic?

### Making Atomic History
Git provides us with a plethora of tools to make it look like we know what we're doing from the get go. Using them with care and thoughtfulness we can craft history that will make us look good, and smart, too. Let us discuss a few of them, the ones that are usually sufficient to keep the history clean and readable.

#### Amend Your Ways
Let's image we had such a clear idea that we wrote everything perfectly on our first try. We made exactly the changes we needed to make and resisted the urge to include anything unrelated. We're feeling pretty good about ourselves and our code. So we fire a quick `git commit -am <message>`. Lo and behold, an atomic commit in all it glory! The only problem is that immediately after we've committed your changes we notice that the message is not at all clear. It does not say what the commit is about. In our excitement we failed to consider how to describe the changes best. Whatever shall we do now?

This is exactly the situation where we can use the following commands:

- `git commit --amend`
- `git commit --amend -m <message>`

It does what it says on the tin. It lets us amend the most recent commit. In our case, we can use it to simply change the message so that it does not bring shame and dishonour to our family. Excellent for those situations where we do not want to appear as an illiterate brutes. Perfection.

Now consider another situation, similar to the one above. The difference that we did come up with a clear, succinct description of our commit. Instead, we forgot to include some of the changes that are necessary for a proper, self-sustained commit. Have no fear, git has our backs:

{{< highlight bash >}}
git add <file>
git commit --amend --no-edit
{{< /highlight >}}

This would take our `<file>` and include it in the most recent commit, without changing that commit's message. Excellent way to create an illusion that we have it all figured out. Easy history changes, easy life.

#### Find Inner Balance With Rebase
What if we made several commits, some of which should be reordered, and some of which should be merged, as they represent an atomic change? Clearly, `git commit --amend` will not suffice here. Is all lost? Should we just accept the reality and live in the eternal shame our thoughtlessness has brought upon us? Definitely not. Our history, our rules. We can rewrite it and maintain a pristine public profile. With git, it's almost too easy.

Let us first take a simple case where we have three atomic commits, but we would like to reorder them for a better history flow. Suppose we have something like this:

{{< highlight default >}}
d3aea68 Add authentication via Google
c768af2 Fix integer overflow
d00f4c3 Add authentication via Twitter
{{< /highlight >}}

Isn't this confusing. What is that integer doing between all that lovely authentication work? It would surely look much nicer if we reordered our history a little bit and grouped related commits together. But how do we do it? We rebase:

{{< highlight default >}}
git rebase -i HEAD~3
# or 
git rebase -i d00f4c3^
# (^ is short for ^1, or first parent of the commit)
{{< /highlight >}}

The first one is excellent for quick rebases, where we only need to look at a few commits. The second one is better if for you counting is something that happens to other people. Either of the methods will net exactly the same result, though:

{{< highlight default >}}
1 pick d3aea68 Add authentication via Google
2 pick c768af2 Fix integer overflow
3 pick d00f4c3 Add authentication via Twitter
4
5 # Rebase 99b54f7..d3aea68 onto 99b54f7 (3 command(s))
6 #
7 # Commands:
8 # <currently unimportant, but actually useful info>

{{< /highlight >}}

Reading through the lines 8-22 will give a us a succinct (but sufficient) introduction into possible operations. However, for reordering purposes these do not matter. What we need to do to reorder commit history is, well, reorder commits in our default git editor. That is, literally change the first three lines to read like this:

{{< highlight default >}}
1 pick d3aea68 Add authentication via Google
2 pick d00f4c3 Add authentication via Twitter
3 pick c768af2 Fix integer overflow
...
{{< /highlight >}}

Save it and you're done. 

What about the use case where we make a ton of small commits that really should be one or two bigger, atomic commits? Surely merging commits is much more difficult? Nope:

{{< highlight bash >}}
git rebase -i HEAD~3
{{< /highlight >}}

However, instead of reordering, this time we want to make it look something like this:

{{< highlight default >}}
1 pick d3aea68 Add authentication via Google
2 fixup d00f4c3 Add authentication via Twitter
3 pick c768af2 Fix integer overflow
...
{{< /highlight >}}

Now `d3aea68` and `d00f4c3` would be merged together, and the latter commit's message would be discarded (that is, merged commit would have `d3aea68` commit's message). So in the end we'd have something like this:

{{< highlight default >}}
> git log --oneline -2

99b54f7 Add authentication via Google
ac56b69 Fix integer overflow
{{< /highlight >}}

There you have it. The commits are merged. Obviously, authentication commit is now misleading, as it only mentions authentication via Google. So we could either rebase again and `reword` the offending commit, or use `squash` instead of `fixup`. That way, we would merge the commits into a new one and get to write a new commit message for our shiny new commit. To achieve it, our rebase screen should look something like this:

{{< highlight default >}}
1 pick d3aea68 Add authentication via Google
2 squash d00f4c3 Add authentication via Twitter
3 pick c768af2 Fix integer overflow
...
{{< /highlight >}}

Save it. Comments at the bottom will let us know how to write a commit message. In essence, what you write there will be your new commit's message. We can make it look something like this:

{{< highlight bash >}}
Add authentication through 3rd parties

This commit enables authentication through Google and Twitter.

# ...
{{< /highlight >}}

Saving it gives us the following history:

{{< highlight default >}}
> git log -2

commit f98b4badb393834fc4b95825d589048b86e08bae
Author: you <you@email.com>
Date:  Apr 29 23:11:512:10 2018 +0300

    Fix overflowing tags (#2)

commit bbb0a8c505e254258c73d2a3fdb0d16fe78bf4aa
Author: you <you@email.com>
Date: Sun Apr 29 23:21:268:11 2018 +0300

    Add authentication through 3rd parties

    This commit enables authentication through Google and Twitter.
{{< /highlight >}}

Note, by the way, that the hash values of the commits change with each of these operations. We are rewriting the commits, so it's only natural that the hash values will be different.

And that's it. With these commands we are well on our way to maintain a pristine, atomic history that will be a pleasure to gaze upon.

## Conclusion
What a journey this has been. We looked at why bloated commits are bad. We convinced ourselves that our mistakes are our own business and the world does not necessarily need to know about them. In fact, we should refrain from leaving traces on the web about how haphazard our development has been. After all, we are _professionals_, and it does not pay to look like we don't know what we're doing half of the time.

We have also learned what are atomic commits, why they are useful and how to make our history atomic. Along the way, we discovered that we can change the commit messages with `git --amend`.  We experimented a bit with `git rebase`, and found it to be an excellent tool not only when the commits need a bit of shuffling to spice up our history, but also when we want to make it really nice and clean and merge multiple commits that really should have been a single commit.

While reading all of this you might have asked yourself if it is not cheating. After all, shouldn't the history contain all the changes, all the traces of what we have been doing? Yes and no. Code history enabled by git is a tool to _help_ our development. However, it shouldn't _hinder_ it. We should not make our history confusing, hard to read and follow. Doing that defeats the purpose of the history, as eventually the effort of understanding it becomes too great.

We are all humans with imperfect cognitive processes. We make mistakes, and sometimes we record those mistakes. These records can be very confusing a month or two along the way. We need to make sure we do not shoot our future selves in the foot now. Make yourself a favor and fix them before calling it a day. Git shows us a way.

And if you really enjoy seeing all the bloody history, reach for `git reflog`.