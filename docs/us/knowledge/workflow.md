---
sidebar: false,
sidebarDepth: 3

---

# Workflow

Index
[[TOC]]

::: tip Note
After working for so long, I've realized that each company has its own work mode. I want to organize the processes, nodes, and other details myself. I will also express my views and thoughts on some of these aspects. 😅
:::

---

## Requirement Scheduling


Whether it is an in-house project or an outsourced project, the requirements are endless. 
However, there will most likely be considerations such as **`Priority`**, **`Requirement Decomposition`**, **`Resource Allocation`**, and so on.
Therefore, how to allocate and utilize resources is also crucial.

---

The purpose of requirement scheduling is to help developers anticipate the direction and rough workload of future requirements, 
and it is also a reflection of ***`iterative development`***.

## Requirement Review

The review typically includes the following aspects: requirement background, functional modules, page interactions, visual style, data statistics, requirement timeline, requirement approach, etc.

- **<font color="red">Requirement Background</font>**: It’s important to explain the reason behind the need for the resources to fulfill the requirement. It cannot be a command with no feasibility or a vague request for someone to randomly work on something. Additionally, this helps the development team assess the core points of the requirement.
- **<font color="red">Functional Modules</font>**: It’s best to present them in a list format, because if it’s expressed casually, it’s easy to miss points or cause unnecessary debates. This approach also makes it easier for the testers.
- **<font color="red">Page Interactions</font>**: Every step and process needs to be reflected in the product, making interactions very important. Both the frontend and backend need to base their judgment on this to determine the timing of API calls or how to design them (e.g., whether it should be asynchronous, whether multiple interfaces can be consolidated into one, etc.).
- **<font color="red">Visual Style</font>**: It should align with the product's positioning. For non-professional UI, no deep understanding is required. 🥲
- **<font color="red">Data Statistics</font>**: Whether it's UV, PV, GVM, or any other metrics, these should be clarified to help the development team consider data collection when designing the database tables. It’s best to present this in a list format as well.
- **<font color="red">Requirement Timeline</font>**: Deadline... ☠️
- **<font color="red">Requirement Approach</font>**: Why certain features, interactions, or visual elements are designed this way, and the reasoning behind them. While not a necessity, this adds professionalism and makes the argument more persuasive.

---

::: warning Core Elements !!!
1. Meetings must have conclusions and actionable outcomes (such as documents or other deliverables). No conclusion means wasted time.
2. Points that are unclear or cannot be finalized during the meeting should be promptly followed up afterward and ultimately documented in the designated requirement document.
3. Avoid inter-departmental political struggles or arguing over trivial points for the sake of "battle." Focus on the core elements and prioritize what's important. (´థ౪థ）σ
:::

## Code Implementation

Output: API documentation, design documentation, testing branch code.

**For changes to existing code, the following should be followed:**
1. Follow the previous abstraction layers and coding style as much as possible.
2. Reuse existing function wrappers and utility classes to avoid reinventing the wheel.
3. Do not casually modify existing code to accommodate new requirements. Other people’s code may have extensive compatibility considerations. (´థ౪థ）σ

**For new features or initial projects, the following should be followed:**
1. Design and code according to the specified standards.
2. Allow appropriate redundancy, but not redundancy for the sake of redundancy, because requirements are always changing and iterating.
3. Write comprehensive and polished documentation. A good start is half the success.

## Code Testing

- Perform functional self-testing based on test cases.
- Conduct preliminary stress testing in the test environment.

## Integration Testing

Frontend and backend should perform page call tests in the test environment and run through the requirement list.

::: tip Note
During the coding process after the requirement review, try to communicate more with the frontend developers. Express your ideas clearly and list the available APIs or functions you can provide. Otherwise, there may be miscommunication or conflict between frontend and backend at this stage.
:::

## Test Case Testing

Testers will be involved in conducting functional process testing, covering the entire business flow. 
During this stage, many overlooked details will be discovered, and we need to fix the issues promptly based on the test results. 
If some problems were not identified earlier, new interfaces might need to be added, or previous code might need to be revised,
which will lead to a slight increase in workload after the testing phase. This also reflects the effectiveness of communication during the requirement review.

## CR

After the development work is completed and tested successfully, we need to submit the code for review by relevant personnel. 
This step allows others to make suggestions or modifications based on aspects such as `coding standards`, `encapsulation rationality`, and `functional gaps`.



::: tip Note
1. This process should be led by the developer. If possible, it’s a good idea to use screen sharing for discussions and presentations.
2. Developers have different abilities, approaches, and habits, so Code Reviews (CR) can help unify and ensure the quality and style of the code.
:::

## Grayscale (Smoke Testing)

Test and experience by a subset of users. If there are any issues, this is the last point in the normal workflow where modifications can be made. Developers should pay extra attention here.

## Release

Deploy the version to production!!! :tada:

## Post-Mortem

Review the entire development process, including the `Problems Encountered`, `How They Were Solved`, `Highlights Of The Code`, 
and `Product Thinking`. It’s recommended to document the post-mortem.


A good post-mortem allows us to view the entire process and product from a higher perspective, and it is a great way to improve oneself. Personally, I’ve gained a lot from it.

---

::: warning ￣□￣｜｜
Under construction :construction:
:::