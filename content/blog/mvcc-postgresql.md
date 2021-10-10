---
title: "MVCC in PostgreSQL"
date: 2021-10-10T14:25:13+03:00
categories: [databases, postgresql]
tags: []
draft: false
include_toc: true
description: "Concurrency control is essential for databases. How does PostgreSQL implement it?"
---

Recently I’ve had the opportunity to give a short presentation at my work on PostgreSQL, and more specifically, concurrency control. While preparing for the presentation, I’ve come across a term that I was not familiar with: _multiversion concurrency control_ (MVCC). I wish I could tell myself that this is an obscure area of research that I had no business of knowing anyway, but the fact is that it is a pretty well known concurrency control method. PostgreSQL is not particularly shy about it itself - the introductory section of the 13th chapter of PostgreSQL documentation explicitly states that the database uses MVCC to maintain data consistency [[1]](https://www.postgresql.org/docs/13/mvcc-intro.html). However, the section is a little short on the details, so I wanted to explore the mechanism in greater detail.

## Concurrency Control
First step to understanding MVCC is understanding what concurrency control is and why it is important. Simply put, concurrency control is an activity aimed at coordinating concurrent access to the database system. In essence, the goal of it is to produce the same result as if the transactions were run serially - in other words, as if there were no concurrency happening. Thus, a properly controlled system would preserve an illusion that each user is operating on the database alone, without transactions stepping on each other’s toes [[2]](https://courses.cs.washington.edu/courses/cse550/16au/papers/CSE550.Conc-DistDB.pdf)[[3]](http://www.people.fas.harvard.edu/~cs265/papers/bernstein-1983.pdf).

To drive the point home, imagine a database that offers no concurrency control and an inventory management system that uses such a database. At some point in time two concurrent transactions start performing operations. One transaction decrements an inventory and starts creating an order entry. The other transaction reads the inventory and sees that it has been decremented. It attempts to locate a corresponding order, yet it fails to do so - it reads the state of the system after inventory has been decremented but before order entry has been created. Thus, for a (hopefully) brief moment it appears that some items from inventory have simply vanished from the system. The second transaction has been exposed to inconsistent data. Depending on the system this may result in subtle bugs that are painful to reproduce and fix.

## Transaction Isolation
To avoid such situations we may wish to introduce _isolation_ of transactions, which is a property of concurrency control. Isolation of transactions provides certain guarantees in situations when data is accessed concurrently [[4]](https://en.wikipedia.org/wiki/Multiversion_concurrency_control). For example, one isolation level may allow us to see uncommitted data, whereas the other would only show data that has been committed before a transaction began. Thus, we would be able to tailor isolation levels to the needs of our system. The question then is, how can we enforce these isolation levels? How would one go about ensuring that we maintain a consistent view of data even when the system has multiple users reading and writing to the same database?

In fact, there are a few ways to do it. A relatively simple but somewhat naive way to achieve transaction isolation would be to make heavy use of locks. Imagine that we want to read a table. To prevent anyone from interfering with our reads before we are finished we could simply lock the whole table (or a subset of rows that we are interested in). This would make sure that we always see data at the moment that we acquired a lock on said tables. Conversely, when writing to a table we could lock it so that no one can read it until we are finished. This way, we make sure that our reads always see consistent data.

Nevertheless, there are obvious drawbacks to such an approach. Locking a table (or even a row) means that no one can access it. This may be fine if we’re planning to have only a few concurrent transactions - we may not even notice it. It may also be sufficient for systems where we do not particularly worry how fast operations are performed, as long as they are performed. On the other hand, if performance matters, we will run into lock contention.

Imagine we have a fairly heavily used website where we also generate hourly reports. Assume that each report locks tables that are routinely used, for example, users table, comments table, and few others. Naturally, the report is somewhat slow, since it needs to aggregate a lot of data, process it, perhaps insert entries to a few other tables or adjust a few columns. There is almost no question that it is going to be much slower than routine operations. Thus, if it locks the tables that it uses, all other transactions will have to wait to perform any other operation, meaning that functionalities such as login, commenting, voting, etc. will be suspended until it is done. Of course, the example is exaggerated - we can design a locking mechanism that would be less draconic, and just as effective. Nevertheless, locks do have a non-trivial impact on performance, and ideally we would like to avoid them as much as possible.

## Multiversion Concurrency Control
As it turns out, there is a better way to achieve transaction isolation, and this is where we turn to MVCC. As the name implies, instead of keeping locks on rows or tables, we can have multiple versions of the same resource. By having “snapshots” of the data we can improve performance of concurrent transactions. This way readers do not block writers, and writers do not block readers [[5]](https://momjian.us/main/writings/pgsql/mvcc.pdf). Instead, readers see some specific version (snapshot) of the data, whereas writers create a new version of it. The version of the snapshot that the readers see depends on transaction isolation level.

So how does it work? Well, there does not seem to be a standardized way to implement MVCC. Furthermore, since there are multiple databases that use it [[6]](https://en.wikipedia.org/wiki/List_of_databases_using_MVCC), we can’t distinguish One True Way to achieve MVCC. Nevertheless, we can take a look at PostgreSQL’s implementation and take some high level notes on the way it can be implemented.

## MVCC in PostgreSQL
Unlike MySQL (which uses undo logs [[7]](https://dev.mysql.com/doc/refman/8.0/en/innodb-multi-versioning.html)) PostgreSQL implements MVCC by keeping track of some metadata on each row: `XMIN` and `XMAX`, (`X` stands for transaction). It also keeps the current transaction id (`XID`). Although not visible in usual results, we can access both row metadata as well as transaction id:

{{< highlight sql >}}
SELECT XMIN, XMAX, * FROM <table>;  -- row metadata
SELECT txid_current();  -- current transaction id
{{< /highlight >}}

From a bird’s point of view, every transaction is assigned an id. Inserts and updates set `XMIN` on a row (also known as a _tuple_) whereas updates and deletes set `XMAX`. PostgreSQL combines isolation levels and these three values to ensure that transactions see only the data that they are supposed to see.

To make it more concrete, let us consider an example. For the remainder of an article, assume we are operating under a `READ COMMITTED` transaction isolation level. This means that only data from _committed_ transactions can be read. Imagine two concurrent transactions, _Ta_ and _Tb_.

| _Ta_ | _Tb_ |
|:---|:---|
| _Ta_ is opened with `XID=1` | _Tb_ is opened with `XID=2`. |
| _Ta_ inserts row _R_ into a table _T_.  The row gets `XMIN` equal to `1` (current transaction id), and `XMAX` equal to `0`. However, _R_ is not committed yet. | |
| | _Tb_ attempts to read table _T_. Since _R_ is not committed yet, _Tb_ does not see it. |
| _Ta_ commits changes. | |
| | _Tb_ reads table _T_ again. This time it sees _R_. |

In general, if `XID` is higher than `XMIN`, the transaction is allowed to see the new row. However, `READ COMMITTED` is a little bit different in a sense that the current executing _statement_ (rather than transaction’s start) becomes a lower boundary for row visibility [[8]](https://vladmihalcea.com/how-does-mvcc-multi-version-concurrency-control-work/).

What about `XMAX`? When would it be considered? To see `XMAX` in action, let us turn to a `DELETE` statement. Assume that we have a row _R_, where `XMIN=1` and `XMAX=0`.

| _Ta_ | _Tb_ |
| :--- | :--- |
| _Ta_ is started with `XID=2`. | |
| | _Tb_ is started with `XID=3`. |
| _Ta_ issues `DELETE` statement for row _R_, but does not commit it yet. This sets _R's_ `XMAX` to `2`. | |
| | _Tb_ reads the table and sees _R_, as deletion has not been committed yet. |
| _Ta_ commits changes. | |
| | _Tb_ reads the table again and does not see _R_ anymore, because `XID=3 > XMAX=2`. |

Thus, we can see that in situations where a transaction's `XID` is greater than `XMAX`, the transaction would not see the row anymore.

What is neat about this particular situation is that the _row does not have to be deleted_. As long `XIDs` are greater than `XMAX`, no transactions will be allowed to see the outdated row. On the other hand, we don’t particularly want to keep the stale data lying around, so database systems tend to clean up and remove redundant rows. Nevertheless, the fact that delete does not actually remove data seems a little bit surprising, but only until we remember that MVCC relies on having multiple versions of data to implement transaction isolation.

Another somewhat surprising implementation detail is that `UPDATE` statement _creates a new row and marks the old one as deleted_. Thus, `UPDATE` statement is actually two statements wrapped up in one: `INSERT` and `DELETE`. This has all sorts of interesting consequences, such as needing to create new index entries and bloating heavily updated tables [[9]](https://www.cybertec-postgresql.com/en/), but it does tie in nicely with the MVCC. Rather than modifying the row, we have a snapshot of a row before an update (the one marked as deleted), and a snapshot of a row after the update (the newly inserted one).

The short discussion on `XID`, `XMIN` and `XMAX` (along with transaction commit status) shines a light on how a few relatively simple concepts can be elegantly combined into powerful concurrency control mechanisms. Naturally, the actual implementation is much more complicated, and I urge you to refer to [[8]](https://vladmihalcea.com/how-does-mvcc-multi-version-concurrency-control-work/) and [[10]](https://devcenter.heroku.com/articles/postgresql-concurrency) for more information and examples.

## Drawbacks
To close out the discussion, we should be aware that MVCC is not perfect. Avoiding lock contention and still offering non-blocking reads and writes sounds great (and is great to be sure), but PostgreSQL MVCC implementation has its own drawbacks that should be considered.

The first and the most obvious drawback is redundant data. Imagine that we opened a session in `READ COMMITTED` transaction isolation level. There is a deleted row in the table, which has `XMIN` set to `1`, and `XMAX` set to `2`. However, our `XID` is already 10, and we know for sure that ours is the “oldest” transaction operating on the database. According to what we’ve learned before, no transactions will be able to see the deleted row because its `XMAX` will be lower than any other `XID`. For all intents and purposes, this row is “dead” - it may as well not exist. And yet it does. Therein lies the first problem with MVCC - snapshots are not free, and physical storage is required to house multiple versions of the data, even if the data is already too old to be used by any transactions.

The second problem is that `XID` can only be 32 bits long. Therefore, “only” around 4 billion transactions are supported before `XID` would wrap around to 0. If that were to happen, all transactions would suddenly appear to have happened in the future, since `XMIN` and `XMAX` would be higher than the current `XID` [[11]](https://www.postgresql.org/docs/14/routine-vacuuming.html#VACUUM-FOR-WRAPAROUND). As in life, so in databases: the future is invisible, and so are rows with `XMIN > XID`. Since the transaction would not be able to see the rows, we’d get a perceived data loss, even though the data would still be there - just unaccessible.

One part of preventing the second issue is to use modulo-2^32 arithmetic. In simple words it means that for any given transaction, ~2 billion `XIDs` would be “older”, and ~2 billion remaining `XIDs` would be “newer”. You can verify that yourself by plugging in some values in the following formula (where x and y represent ordered `XIDs`):

{{< highlight text >}}
x < y if (y - x) % WRAP_LIMIT < WRAP_LIMIT / 2
{{< /highlight >}}

For example:

{{< highlight text >}}
x = 3;  y = 50; WRAP_LIMIT = 100
3 < 50 if (50 - 3) % 100 < 100 / 2
3 < 50 if 47 < 50
3 < 50 = true, x is in the past

x = 3; y = 70; WRAP_LIMIT = 100
3 < 70 if (70 - 3) % 100 < 100 / 2
3 < 70 if 67 < 50
3 < 70 = false, x is in the future
{{< /highlight >}}

In essence, this results in a circle rather than a line of `XIDs`, where we’ll never have a situation in which our `XID` suddenly becomes the “oldest” due to wraparound and all other rows appear to have been inserted in the future. Nevertheless, moving the “window” of two billion transactions around the circle means that we’ll lose sight of `XIDs` that are at the lower end of the window as their `XID` will suddenly appear to be in the future.

## Remediation
The problems outlined above can be addressed by running the `VACUUM` command regularly. First of all, it reclaims “dead” rows for reuse by new rows. This avoids the perpetual need for more disk space. Second, it solves the wraparound issue by marking sufficiently old rows as “frozen” (a flag bit is set on such rows). Frozen rows do not follow the usual comparison logic - they’re always considered to be older than any current transaction in the system, no matter their `XIDs`. Naturally, this process is not entirely bullet-proof, as can be seen from experiences of Sentry [[12]](https://blog.sentry.io/2015/07/23/transaction-id-wraparound-in-postgres),  Mailchimp [[13]](https://mailchimp.com/what-we-learned-from-the-recent-mandrill-outage/) and Joynet [[14]](https://www.joyent.com/blog/manta-postmortem-7-27-2015). However, it works well enough, although a deep understanding of how PostgreSQL implements MVCC is required to make the most of it.

## Conclusion
Taking a step back, we can see that at a high level PostgreSQL employs elegant yet simple concepts to implement powerful concurrency control mechanisms. It is telling that despite many bug fixes and improvements the underlying idea behind the implementation has remained largely the same for many years. It is deeply inspiring to see that small, understandable components can be combined into systems powering massive enterprises all around the world.

## Sources
1. https://www.postgresql.org/docs/13/mvcc-intro.html
2. https://courses.cs.washington.edu/courses/cse550/16au/papers/CSE550.Conc-DistDB.pdf
3. http://www.people.fas.harvard.edu/~cs265/papers/bernstein-1983.pdf
4. https://en.wikipedia.org/wiki/Multiversion_concurrency_control
5. https://momjian.us/main/writings/pgsql/mvcc.pdf
6. https://en.wikipedia.org/wiki/List_of_databases_using_MVCC
7. https://dev.mysql.com/doc/refman/8.0/en/innodb-multi-versioning.html
8. https://vladmihalcea.com/how-does-mvcc-multi-version-concurrency-control-work/
9. https://www.cybertec-postgresql.com/en/hot-updates-in-postgresql-for-better-performance/
10. https://devcenter.heroku.com/articles/postgresql-concurrency
11. https://www.postgresql.org/docs/14/routine-vacuuming.html#VACUUM-FOR-WRAPAROUND
12. https://blog.sentry.io/2015/07/23/transaction-id-wraparound-in-postgres
13. https://mailchimp.com/what-we-learned-from-the-recent-mandrill-outage/
14. https://www.joyent.com/blog/manta-postmortem-7-27-2015