<?php
if(array_key_exists("sleep", $_POST))
	sleep( intval($_POST["sleep"]) );
?>
<tr>
	<td class="name"><img src="styles/img/avatar.png" height="48"/><br/><?php echo $_POST["login"];?></td>
	<td class="comment"><?php echo $_POST["comment"];?></td>
</tr>