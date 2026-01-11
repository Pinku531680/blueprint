# Blueprint

A multi-user real-time online collaboration whiteboard

## Live Demo -
https://pinku531680.github.io/blueprint/

Note - The backend is deployed on **Render** free-tier, so it might take a few seconds to create the room if the server is asleep.

## Features and implementation overview

1) **Entirely from scratch -**  Every functionality has been implemented from scratch without using any third-party whiteboard libraries.
2) **Collaborative Mode -** Up to 5 users can join the room and interact with the shared whiteboard with features including free-hand drawing,
   adding and formatting text, erasing, with all changes being broadcast to connected clients in real-time using web sockets.
3) **Custom Concurrency control system for board -** Inspired by database locking mechanisms and using mutual exclusion concepts, I developed my custom concurrency control system for
   the shared whiteboard so that there are no data conflicts, no deadlocks on network failure, and no user is out of sync.
4) **Collaborative Transparency -** The board lock mechanism provides temporary, exclusive access to one user at a time. Additionally, there are properly developed indicators
   showing which user has the lock/control and for what purpose.
5) **Custom State Management -** Implemented custom state management that allows multiple-page support and a robust undo-redo functionality independently across all pages.
6) **Role-based Administrative Controls -** This feature allows role-based administrative controls for session moderation, like removing users, clearing shared canvas, and
   disabling a user (after which the disabled user can also request the admin to enable them, the admin gets a dialog where he decides either to accept or reject that request).


## Tech Stack

**Frontend:** JavaScript, React.js, Canvas API

**Backend:** Node.js, Express.js, Web Sockets 

## Significant Challenges

1) Building custom state management to support multiple pages and a robust undo-redo functionality independently across all pages.
   
2) Scaling and normalizing the coordinates before sending, as different connected users might have different canvas widths and heights. Additionally, implementing the erase functions
   became difficult due to this fact.
   
3) Implementing a custom concurrency control system for the board was the most difficult task. The design was inspired by locking mechanisms in modern databases and mutual exclusions.
   Managing the board lock, deciding which user can have control, and releasing the focus/lock at the right time were functionalities that I worked on for the first time.


The web socket communication and broadcasting are so efficient because of wonderful and efficient native implementations (the WebSocket API by Google Chrome and the ws package in Node.js). 
As a result, the programmer needs to care only about minimizing the data to be broadcast, which is not an impossible challenge. Understanding web sockets to some depth is always a plus point when dealing with real-time applications. 

Similarly, for implementing a custom concurrency control system for the whiteboard, having a good understanding of how the OS really handles and prevents issues in concurrency is crucial, along with understanding how modern databases handle problems that were critical decades ago, because if concurrency control and locking mechanisms are not implemented the right way, the application can break in many cases leading to data inconsistencies and even deadlock situations due to network failure of user who acquired the lock.

These videos from YouTube, apart from the official documentation, helped me understand a lot -
1) https://youtu.be/2Nt-ZrNP22A?si=jrWr-59aOwFyAdAZ by **Hussein Nasser**
2) https://youtu.be/NvZEZ-mZsuI?si=kYiBT62MBREobMmz by **ByteMonk**

Some online content on locking mechanisms, concurrency that I found very useful(other than textbooks) - 
1) https://web.mit.edu/6.031/www/fa21/classes/23-mutual-exclusion/
2) https://www.isical.ac.in/~malaybhattacharyya/Courses/DBMS/Spring2024/Class%20VIII.pdf
3) https://www.cs.utexas.edu/~witchel/372/lectures/06.Locking.pdf

## Future Plans for the Project ##

1) Develop a freely drawn shape detection feature for circles, rectangles, and triangles using feature extraction techniques and KNN or a neural network, like CNN.
2) Optimizing erase functions to work efficiently even when a lot of paths have been drawn on the page.
3) Add functionality to insert commonly used mathematical symbols that are not present on the keyboard.


