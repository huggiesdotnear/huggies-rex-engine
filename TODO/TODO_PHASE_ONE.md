# TODO

phase one full read only program

`cargo run` should luanch a full axum program.

on start up we shuld do "get_number_of_pools" and "get_pools" with like a limit of 500 at a time view call on rhea to get all the latest pool info to keep in state

we should the use intear-events to keep our instate data fresh so we dont have to guess when to do rpc view call, using intear event methods "trade_pool", "trade_pool_change", "trade_swap", and anyother relvant methods.

our program should have to methods for geting resturn, a "get_return" view call to rhea, but also inturnal logic for claulating this becuase we have rhea contratc full sate in memory.

we should also use intear price-indexer primarliy for geting all token metadat so we dont have to use ft_metadata rpc view requests. for price of tokens i would love if we could use our own internal logic based on the state that we have, but if too colicated we can just use intear prices. but for the token datils the decimal places is omportant  to that we can display them in a huma readbale way in our ui.


our in memory state should stay fresh and have the abilyty to dynmicly update as new tokens and pools are created. 

our axum app should be fully typed and have clean state mangagment.

we shpuld have a fullstack web app with backend json only routes after /api/.
for pages this is a full blown dex ui.
so we need a page with swap componet for slecting tokens and inpiting amounts in and out and getting a return
we neeed a page that shows a list of pools.
we also need token pages that shows a list of all the pools a token is in.
and a pool page
and a page or pages for streaming live data form the websocket.
we should also have a profile page at /trader/{account_id}, we should set this just for the view only "HUGGIES_REX_SIGNER_ACCOUNT_ID=frozen_bot2.user.intear.near",
trader pages should do a rhea view call of this method "get_deposits" we can also do a view account query to get near balcnce for that account id.

our vault is for savng and creating token watchlish/favoirt list, lists of account ids of other traders we wnat to follow so we can cehck our their profile and how much assest they have.
this is part of phase one, read and write to our vault folder location.



our program should support like for the token inputs, token slecter, and pool page to search for by token name or ca or whatever, and our backend needs to support this as we will not have heave js client side logic, and it needs to be fast backend.

---

more
we will use my near kit tool box fuctions for the rhea contract view calls, also we can confige the client to use my rcp balnace client. probly worth checimg each of the rpcs directly to verify they give same resosns.

also for some of the repnse, like for the get_pools, do we have tyoes for that in our near-kit-tool-box-rs, i think we do?


i dont know if i mentioned this but our app should keep track of a lot of pool and token details, some of this can stay in memory but some of this can be saved in catch .josn files in a catch folder in our vault location, or in an sqlite database so not so much in memory.

our app should have logic and enpoints for geting this data that we have, so endpinst for token info, and get_return routes like i already mentioned

we should probly also have some kind of routing logic so usere can speify any token in and any token out and get some routes and choose the best route.


just so you some furture plans for this is to use this app to set up autmated trading strdgies and bots and orders that exute at certain price points. we could go ahead an implent paper trading and paper strgeies, also all trade history should be saved to json files in our vault, so that we can moniter profits and losses.

i guss for trades have what we call the open and close it. so when a user trades to a ceratain amount, they have that hstru file and can close that trade by swapig that amount back to the token they started with. but also they can trade freely their balcne, so if they trade that to anoher token and then dont have that then they cant't close, but we will deal with this later.

anyway remenebr everythig fully typed.

=====================
<br/>
copyright 2026 by sleet.near
