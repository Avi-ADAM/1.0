<script>
	import ChatMessage from '../../celim/ChatMessage.svelte';
	import TodayDivider from '../../celim/TodayDivider.svelte';
	

	let nameMe='Me';
	let profilePicMe='https://p0.pikist.com/photos/474/706/boy-portrait-outdoors-facial-men-s-young-t-shirt-hair-person-thumbnail.jpg';

	let nameChatPartner='John Doe';
	let profilePicChatPartner='https://storage.needpix.com/rsynced_images/male-teacher-cartoon.jpg';
	
	let messages = [{"messageId":416,"message":"abc","timestamp":1587139022488.826,"sentByMe":false,"timeRead":1587139025367.015},{"messageId":417,"message":"test","timestamp":1587139034294.678,"sentByMe":true,"timeRead":1587139048713.461},{"messageId":418,"message":"a","timestamp":1587139047495.052,"sentByMe":true,"timeRead":1587139048713.461},{"messageId":419,"message":"testset","timestamp":1587139312376.663,"sentByMe":true,"timeRead":1587139336397.5078},{"messageId":420,"message":"tatta","timestamp":1587139349155.217,"sentByMe":false,"timeRead":1587139359024.353},{"messageId":426,"message":"t","timestamp":1587577393781.811,"sentByMe":false,"timeRead":1587686514958.049},{"messageId":427,"message":"aaa","timestamp":1587577411018.97,"sentByMe":false,"timeRead":1587686514958.049},{"messageId":431,"message":"a","timestamp":1587652540004.281,"sentByMe":false,"timeRead":1587686514958.049},{"messageId":432,"message":"u","timestamp":1587686520069.1272,"sentByMe":true,"timeRead":1587687940655.5369},{"messageId":433,"message":"a","timestamp":1587782491376.533,"sentByMe":false,"timeRead":1589814592979.757}];

let todayMessages =[
{"messageId":420,"message":"Hey did you receive my message last night? ","timestamp":1587139349155.217,"sentByMe":false,"timeRead":1587139359024.353},		  {"messageId":426,"message":"Are you there?","timestamp":1587577393781.811,"sentByMe":false,"timeRead":1587686514958.049},
	{"messageId":418,"message":"hey","timestamp":1587139047495.052,"sentByMe":true,"timeRead":1587686514958},{"messageId":419,"message":"Yes!","timestamp":1587139312376.663,"sentByMe":true,"timeRead":0},
];

</script>



<style>
	.direct-chat .card-body {
		overflow-x: hidden;
		padding: 0;
		position: relative;
	}

	.direct-chat-messages {
		-webkit-transform: translate(0, 0);
		transform: translate(0, 0);
		height: 400px;
		overflow: auto;
		padding: 10px;
		transition: -webkit-transform .5s ease-in-out;
		transition: transform .5s ease-in-out;
		transition: transform .5s ease-in-out, -webkit-transform .5s ease-in-out;
	}

	.contacts-img {
		border-radius: 50%;
		width: 40px;
		height: 40px;
	}
	.contacts-name {
		margin-left: 15px;
		font-weight: 600;
	}
</style>

<svelte:head>
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
</svelte:head>

<div class="card card-danger direct-chat direct-chat-danger">
    <div class="card-header">
        <div class="card-tools d-flex">
            <img class="contacts-img" src={profilePicChatPartner} alt="profilePic">
            <span class="contacts-name">{nameChatPartner}</span>
            <span class="mr-auto"></span>
        <!-- //על הצאט  <button type="button" class="btn btn-tool" title="Contacts"><Fa icon={faUsers} /></button>
          //למזער  <button type="button" class="btn btn-tool"><Fa icon={faCompressArrowsAlt} /></button>--> 
        </div>
    </div>
    <div class="card-body">
        <div class="direct-chat-messages">
            {#each messages as message}
                <ChatMessage
                    nameMe = {nameMe}
                    profilePicMe = {profilePicMe}
                    nameChatPartner = {nameChatPartner}
                    profilePicChatPartner = {profilePicChatPartner}
										message={message.message}
									  timestamp={message.timestamp}
										sentByMe={message.sentByMe} 
										timeRead={message.timeRead}
										/>
            {/each}
					
					<TodayDivider></TodayDivider>
					 {#each todayMessages as todayMessage}
                <ChatMessage
                    nameMe = {nameMe}
                    profilePicMe = {profilePicMe}
                    nameChatPartner = {nameChatPartner}
                    profilePicChatPartner = {profilePicChatPartner}
										message={todayMessage.message}
									  timestamp={todayMessage.timestamp}
										sentByMe={todayMessage.sentByMe} 
										timeRead={todayMessage.timeRead}										
										isToday={true} 														 
										/>
            {/each}
					
        </div>
    </div>
    <div class="card-footer">
        <div class="input-group">
            <input type="text" placeholder="Type Message ..." class="form-control">
            <span class="input-group-append">
                <button type="button" class="btn btn-primary">Send</button>
            </span>
        </div>
    </div>
</div>