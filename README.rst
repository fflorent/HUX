Http by Using XML (HUX)

0- WARNING
==========
June 2011 : the project is very young. Using it for production is not recommended for now.

I- LICENCE
==========
    HTTP by Using XML (HUX)
    Copyright (C) 2011  Florent FAYOLLE
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.

Note: This "MIT" licence grants you the right to develop and share plugins in any licence you want. 
If you have patches for this project, you would make people happy if you share it freely as well !

II- Description and Features
============================

HUX (for Http by Using XML) gives you a simple way to load HTML content with XML Http Requests (in other words : *AJAX*) without writing any line of Javascript! You will only need to have basic knowledges in (X)HTML.

HUX aims at being simple and powerful. With HUX, you can : 

 - load content in your HTML document dynamically (i.e. you do not refresh the whole page)
 - simply update the URL when a new content is loaded
 - use the Previous/Next Button
 - send the data of a form and load the answer of the server dynamically
 - ``other features coming soon...``
 


III- Advantages
===============

It offers the following advantages: 

- it is much easier to set than Ajax
- you load data dynamically, using <A> links
- Search Engine can index your website, while Ajax does not originally
- you can get back contents thanks to URL update


IV- "Installation"
==================
Just download hux.js, and include it in your HTML documents, in the <HEAD> Section, like this : 

::

	<script type="text/javascript" src="/path/to/hux.js" ></script>

V- How-To
=========
Let's begin !

For now, there is three possible applications with HUX : 
 - create links without URL Update
 - create links with URL Update
 - create forms
 
1- Links without URL update
---------------------------
Note: The attributes which are relative to HUX are prefixed with *data\-hux\-*. It is the advised prefix (it avoids possible conflicts with other Frameworks and is HTML5 valid), but you can also use the following prefixes : *data-* (HTML5 valid), *hux:* (XHTML only, avoids conflicts, but doesn't pass the W3C validator), and no prefix (doesn't pass the W3C validator).

For that, you have at your disposal 3 attributes : 
 - href: the link to the content to load
 - data-hux-target: the id of the element which will receive the content loaded thanks to HUX
 - data-hux-filling: (optional) indicates how HUX should inject the content. Its value can be : 
	* "replace" (default) : we empty the target element, and replace its content
	* "append" : we inject the content at the end of the target element
	* "prepend" : we inject the content at the beginning of the target element

Example : 

::

	<div id="container">This content will be replaced once the user will click on the following link : </div>
	<p><a href="/path/to/content.html" data-hux-target="container">Load !</a></p>
	





2- Links with URL update
------------------------
You just need to create a link of this form : 

::

   <a href="#!TARGET_NODE_ID=/path/to/content.html">click me</a>

Where TARGET_NODE_ID is the id of the element whose content will be replaced by the freshly loaded one.

Example : 

::

 <div id="container">This content will be replaced once the user will click on the following link :</div>
 <p><a href="#!container=/path/to/content.html">Load !</a></p>

Note : to make pretty URL with Apache (for example, have #!container=content), you should use an .htaccess, with the mod RewriteEngine enabled.
	See http://httpd.apache.org/docs/1.3/mod/mod_rewrite.html

3- Forms
--------
You have at your disposal 4 attributes : 
 - action: the URL where to send the form data once the user submits. HUX will send the data asynchronously.
 - method: "GET" or "POST"
 - data-hux-target: see *1- Links without URL update*
 - data-hux-filling: (optional) see *1- Links without URL update*. **Default is "append"**
 
Example : 

::

	<div id="comments"></div>
	<form hux:target="comments" action="/path/to/cgi_treatment" method="POST">
	  <p>login :<br/><input type="text" name="login" /></p>
	  <p>Comment : <br/><textarea name="comment" id="comment_content" ></textarea></p>
	</form>



VI- Use it!
===========
Stop reading, try it!