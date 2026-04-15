# Wesiq

## 1. Stack Overview

The Project's **Back-End** is Built on Popular Python-Based Web Framework Called **Django**, Utilizing **PostgreSQL** for Database Management Instead of Default SQLite. To Enhance **Front-End** Security and Streamline Debugging, **TypeScript** was Implemented Instead of Vanilla JavaScript. Additionally, **SCSS** was Utilized to Accelerate And Organize Style Development.

## 2. Services And Libraries

The Application Integrates Several Third-Party Services and Libraries to Enhance Functionality. Most Important of Them are These:

- **Google OAuth 2.0**: Enables Seamless User Authentication via Google Account.

- **reCAPTCHA V3**: Protects Forms And Registration Processes from Automated Bot Activity.

- **Google Analytics**: Provides Comprehensive Web Traffic and User Behavior Metrics.

- **Chart.js**: Facilitates Clear Data Visualization Through Interactive Graphs.

- **Rosetta**: Simplifies The Management and Implementation of Multi-Language Support, Utilizing GNU Gettext Functions For Translations. A Key Professional Feature is the Use of Translated URL Addresses, Where Each Route is Automatically Prefixed and Translated Based on the Selected Language (e.g., /en/homepage/ or /sk/domov/). This Optimization not Only Improves the User Experience for Global Audiences but Also Significantly Enhances Search Engine Optimization (SEO).

- **Celery** (Worker), **Redis** (Message Broker), And **Flower** (Celery Monitoring Tool): Handles High-Performance Requirements for Asynchronous Processing. The Project Incorporates Redis as a Message Broker and Celery For Managing Asynchronous and Scheduled Background Tasks Via Celery Beat, Such as Automated Database Cleanup. Flower is Utilized for Real-Time Monitoring and Management of Celery Tasks.

- **Version Control**: The Entire Codebase Is Managed And Backed Up Using **Git** and **GitHub**. Sensitive Data, Including Passwords and API Keys, are Secured and Excluded from Version History. They are Managed Through Environment Variables (Local .env File).

- **Dockerization**: The Application is Fully Dockerized, Ensuring the Project is Bundled into a Docker Image and Ready for Consistent Deployment Within A Docker Container.

## 3. Components

### 3.1. Navigation Interface

The Navigation Bar Serves as the Primary Tool for Seamless Site-Wide Redirection. It is Engineered with a Focus on User Experience and Responsiveness, Ensuring Consistent Accessibility Across all Devices and Screen Sizes.

#### 3.1.1 Core Functionalities

- **Smooth Navigation**: Integrated logic allows for Smooth Auto-Scroll to specific page sections when clicking designated buttons, enhancing the single-page application (SPA) feel.

- **Adaptive Design**: The component is fully Responsive. It features a dynamic layout that automatically shrinks or adjusts based on screen real estate.

- **Mobile Optimization**: On smaller screens and mobile devices, the menu transitions into a "Hamburger" Icon, providing a clean, space-efficient interface for touch-based interaction.

### 3.2. Reviews Visualization Graph

The Reviews Graph provides an intuitive interface for visitors to evaluate user feedback and overall satisfaction regarding services or products. This component synthesizes complex data into a visually compelling and interactive experience.

#### 3.2.1 Functional Features

- **Rating Distribution**: The graph displays individual bars for each rating tier (1 to 5 Stars), which are dynamically colored based on the percentage of total reviews.

- **Interactive Tooltips**: Users can view the exact count of reviews for a specific rating by simply Hovering over the corresponding bar.

- **Summary Statistics**: The component prominently displays the Average Rating and the Total Review Count, providing an immediate snapshot of customer sentiment.

#### 3.2.2 Advanced Animation and Design

To enhance user engagement, the graph incorporates a sophisticated Animation Pipeline:

- **Scroll-Triggered Activation**: The graph remains hidden until the user scrolls into view, at which point a Fade-In effect is triggered.

- **Dynamic Bar Loading**: Each bar executes a smooth transition, filling its length and transitioning its Color based on the calculated percentage.

- **Numerical Counters**: Both the Total Review Count and the Average Rating utilize an "increment animation," where the numbers rapidly count up to their final values simultaneously with the bar animations.

### 3.3. Cookie Policy

#### 3.3.1 Consent Management

Upon The Initial Visit To The Website, A Cookie Policy Consent Menu Promptly Appears. Users Retain The Autonomy To Select Between Accepting **All Cookies** Or Opting For **Only Essential Cookies**. This Selection Directly Dictates Future Cookie Storing Behaviors, Influencing External Integrations Such As Google Analytics.

#### 3.3.2 Change Preferences

Preferences And Ongoing Control. If A User Wish To Adjust Their Previous Choices, They Can Easily Revisit The Menu By Clicking The Privacy Policy Button Located Within The Footer Section Of The Page.

### 3.4. Contact Form

#### 3.4.1 Interface

The Contact Form Serves As A Direct Communication Channel Between Users And The Development Team. It Enables Visitors To Inquire About Services, Submit Suggestions, Or Report Technical Bugs And System Issues.

#### 3.4.2 Functionalities

- **Required Fields**: Users Must Provide Essential Contact Information, Select An Appropriate Subject From A Categorized Menu, And Compose Their Detailed Message.

- **File Support**: To Provide Clearer Context For Technical Issues Or Specific Inquiries, The System Allows Users To Share Images Or Files As Direct Attachments To The Message.

### 3.5. Login

#### 3.5.1 User Authentication And Login

If The User Has Already Created An Account In The Past, They Can Log Back In When Their Session Expires Or After Manually Logging Out Using The Logout Button. The System Automatically Authenticates The Provided Credentials And Either Grants Or Denies Access Based On Validity.

#### 3.5.2 Social Authentication And Visual Effects

- **Third-Party Providers**: Users Can Choose To Log In Via Google, Apple, Or Facebook Accounts For Faster Access.

- **Interactive Design**: The Social Login Buttons Feature A Visually Appealing Animated Border Effect To Enhance User Engagement.

#### 3.5.3 Account Security And Recovery

- **Password Reset System**: In The Event That A User Forgets Their Credentials, An Easy Password Reset Workflow Is Available To Restore Access Safely.

- **Security Notifications**: Upon Every Successful Login, The System Automatically Dispatches An Informational Email To The User. This Email Includes Instructions For Resetting The Password In Case The Account Access Was Unauthorized Or Compromised.

### 3.6. Registration

#### 3.6.1 User Registration And Account Creation

The Registration System Allows New Users To Intuitively Create An Account By Clicking The Registration Button. Upon Completing A Brief Form, The User's Information Is Securely Stored In The Database To Facilitate Future Logins And Data Retrieval.

#### 3.6.2 Key Validation And Security Features

- **Email Duplication Verification**: The System Automatically Checks Whether The Provided Email Address Is Already Registered To Prevent Duplicate Accounts.

- **Password Length Constraints**: Implements Restrictions Against Overly Short Passwords To Ensure Robust Security.

- **Dual Entry Confirmation**: Requires Users To Retype Their Password A Second Time To Prevent Input Errors.

- **Secure Password Generator**: Includes An Integrated Function To Automatically Generate A Strong Random Password.

- **Clipboard Functionality**: Supports Quick Copy And Paste Actions For The Generated Passwords.

- **Cryptographic Hashing:** For Maximum Safety And Data Protection, All Passwords Are Stored Exclusively As Secure Hashes Rather Than Plain Text.

#### 3.6.3 Account Activation Workflow

After Completing The Registration Form, Users Must Verify Their Identity. The System Automatically Dispatches A Unique Verification Link To The Provided Email Address. Full Access To The Account Is Granted Only After The User Clicks This Link.

### 3.7. Write Review

#### 3.7.1 User Review Submission

The Review Submission System Enables Users To Share Their Personal Opinions And Express Their Overall Satisfaction Or Experience.

#### 3.7.2 Core Features

- **Interactive Rating System**: Ratings Are Visually Represented Using Interactive Star Components That Provide A Seamless And Intuitive User Experience.

- **Review Modification Policy**: To Account For Input Errors Or Evolving Perspectives, Users Possess The Ability To Edit Their Submitted Reviews Once Per Month.

### 3.8. Edit Account

#### 3.8.1 Account Profile Management

The Account Profile Management System Empowers Users To Modify Their Personal Information And Profile Pictures Based On Their Individual Preferences. This Modification Feature Is Accessible Once Per Calendar Month To Maintain Data Consistency. Additionally, The System Includes Dedicated Functionalities To Securely Update Passwords At Any Time.

#### 3.8.2 Account Deletion Features

- **Data Autonomy**: There Is Also An Available Option For Users To Permanently Delete Their Account Directly From The Settings Menu.

### 3.9. Password Reset

#### 3.9.1 Password Reset Procedure

In Order To Modify An Existing Password Or Recover Access Following A Forgotten Password, The System Provides A Dedicated Recovery Workflow.

#### 3.9.2 Verification And Redirection Workflow

- **Email Dispatch**: Upon Requesting A Password Reset, A Unique Verification Code Is Dispatched To The User's Registered Email Address Alongside Detailed Instructions.

- **Flexible Access**: The Email Includes An Optional Direct Link That Redirects To The Reset Page With The Code Automatically Populated. However, Clicking This Link Is Not Mandatory, As Users Are Automatically Navigated To The Reset Page Immediately After Submitting The Initial Request (Where The Code Can Be Entered Manually).

#### 3.9.3 Time Restraints And Visual Indicators

- **Ten-Minute Window**: The System Enforces A Strict Ten-Minute Countdown Timer For Security Purposes. Within This Window, The User Must Input The Verification Code And Their New Password Or Utilize The Automatic Strong Password Generator.

- **Dynamic Visual Cues**: The Timer Circle Dynamically Shifts Colors Based On The Remaining Time, Transitioning Gradually From Green To Red. To Heighten Visual Awareness, The Numerical Countdown Display Turns Red Once The Remaining Time Drops Below Ten Seconds.

### 3.10. Search Bar

#### 3.10.1 Search Bar Component

The Search Bar Component Offers An Efficient Method For Locating Specific Pages By Inputting The Desired Page Title. The System Executes A Relevance Algorithm To Return The Most Applicable Results Based On The Typed Keyword.

#### 3.10.2 Core Functionalities And Input Controls

- **Keyword Matching**: The System Processes Input To Find The Most Relevant Results Associated With The Typed Keyword.

- **Query Clearance**: Users Can Manually Erase Text Using The Backspace Key Or Instantly Clear The Field By Clicking The X-Mark Button.

- **Focus Dismissal**: The Search Interface Can Be Closed Or Canceled By Clicking Anywhere Outside The Boundary Of The Search Bar.

#### 3.10.3 Search History Retention

- **Automated Display**: Previous Successful Searches Leading To Visited Pages Are Stored And Displayed When The User First Clicks Into The Search Bar.

- **Entry Limitations**: To Ensure Only The Most Recent Activity Is Visible, The Display Is Strictly Capped At A Maximum Of Three Items.

- **History Management**: Users Possess Complete Control To Delete Specific Individual Items From Their Saved Search History Whenever They Wish.

### 3.11. Articles

#### 3.11.1 Article And Blog Management System

The Blog Page Serves As A Centralized Hub For Educational And Informational Content. It Features An Advanced Categorization System, Allowing Users To Filter Content Based On Specific Topics Of Interest.

#### 3.11.2 Data Metrics And Metadata

Each Individual Article Displays A Set Of Essential Metadata To Inform The Reader And Track Engagement:

- **Unique Visitor Count**: Tracks And Displays The Total Number Of Individual Users Who Have Viewed The Content.

- **Publication Date**: Clearly States The Date The Article Was Added To The Platform.

- **User Attribution**: Identifies The Specific Author Or User Who Created The Content.

- **Rating System**: Displays The Community Rating For Each Specific Piece Of Writing.

#### 3.11.3 Interactive User Experience

- **Hover Introductions**: The Interface Employs An Interactive Design Where A Short Introductory Text Appears Over A Background Image Whenever A User Hovers Over An Article Card.

- **Content Redirection**: Clicking On A Selected Article Redirects The User To A Dedicated Page Housing The Full Body Of Content.

- **Engagement Forum**: Every Article Includes A Comprehensive Comment Forum Located Directly Beneath The Text, Facilitating Community Discussion And Feedback.

### 3.12. Article Filtering Options

The Blog Interface Includes Intuitive Filtering Mechanisms To Assist Users In Efficiently Navigating And Discovering Relevant Content.

#### 3.12.1 Core Capabilities

- **Keyword Search Integration**: Users Can Seamlessly Filter Through The Available Articles By Typing Specific Terms Or Phrases Into The Integrated Search Bar.

- **Categorical Filtering**: The System Provides The Option To Isolate And Display Articles Based Exclusively On Selected Topic Categories, Allowing For Highly Refined Search Results.

### 3.13. Comment Forum

The Comment Forum Facilitates Community Engagement By Allowing Users To Submit Personal Thoughts And Engage In Threaded Discussions Beneath Each Article.

#### 3.13.1 Core Engagement Features

- **User Identification**: Every Submitted Comment Or Reply Is Prominently Displayed With The Author's Profile Picture And Name To Foster Transparent Communication.

- **Interactive Elements**: Users Can Actively Participate By Leaving Direct Replies To Existing Comments Or Expressing Agreement Through The Integrated "Like" Functionality.

#### 3.13.2 Moderation And Asynchronous Logic

- **Community Moderation**: To Ensure A Safe And Respectful Environment, Users Possess The Option To Report Harmful Or Inappropriate Content. The System Automatically Hides Any Comment That Accumulates A Strict Threshold Of Five Distinct Reports.

- **Instant Interface Updates**: State Changes Such As Adding A Like, Removing A Like, Or Submitting A Report Are Engineered Using Asynchronous JavaScript Fetch POST Requests. This Architecture Guarantees Immediate Visual Feedback And Background Data Synchronization Without Refreshing The Web Page.