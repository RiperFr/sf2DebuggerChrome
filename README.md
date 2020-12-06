# Symfony Profiler shortcut

Give access to Symfony Profiler if any Response from a server is made with the "X-Debug-Token". Very useful for REST & AJAX Development/testing


# In details
This is an extension that help developer and/or tester to see relevant information on Symfony based applications.
When you enable debug mode, you probably noticed a toolBar at the bottom. Very useful, clicking on it lead the the Profiler.
The profiler make easy to access logs and many information about the current request.

This extension is here to allow you to access easily to the Profiler event if the debug toolbar is disabled or not shown.
If you already made REST application with Symfony framework, you know that the Debug tool bar only show up if you render a real webPage.
If you render JSON or XML, you just have the result and to go to the Profiler is a long way.

Actually, if you look at the Response headers, you'll notice a "X-Debug-Token:0b274e"; This is the key to go to the debugger.

This extension can help you to open the profiler of AJAX/XHR request made on your website.

# Screenshot
![Alt text](/ScreenShot/REST.png "One REST call")
![Alt text](/ScreenShot/XHR.png "Multiple XHR calls")

# OFFICIAL LINK
https://chrome.google.com/webstore/detail/Symfony-debuger/denlhphadllhcolhlbbbjmhkgbknmmon


## Licencing
This webapp/extension and all original files contained are under [Creative Commons Attribution License (BY-NC-SA)](http://creativecommons.org/licenses/by-nc-sa/3.0/)

Thanks for VisualPharm for some icons : http://www.visualpharm.com/ [Icon link](http://icons8.com/icons/#!/416/bug)

Thanks for Symfony and SensioLabs for SF icon: http://symfony.com/logo
